import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { DuckDBInstance } from '@duckdb/node-api';
import type { TranslationResult, LLMConfig, QueryDialect, DataModel } from '../types';

export class DuckDBSQLDialect implements QueryDialect {
  private parserInstance: Promise<DuckDBInstance> | undefined;

  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    // Identifier quoting and set semantics follow the DuckDB SQL reference.
    // https://duckdb.org/docs/1.5/sql/dialect/keywords_and_identifiers
    // https://duckdb.org/docs/1.5/sql/query_syntax/setops
    const prompt = `You are a DuckDB SQL expert. Given the following data model and user query, generate a SQL query to answer the question.

    Dataset Context:
    ${stringifyDataModel(dataModel)}

    User Query: ${query}

    Generate exactly one read-only SELECT query (WITH is allowed). Return only SQL text.
    Use the exact table references and column names from the data model, joining tables when needed. Use double quotes for identifier components that need quoting and single quotes for strings.
    Use DuckDB SQL syntax and functions appropriate to the column types. UNION removes duplicates and UNION ALL preserves them; align columns by position, or explicitly choose UNION BY NAME to align them by name.`;

    const { text, usage, finishReason } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });

    if (finishReason !== 'stop' && finishReason !== 'other') {
      throw new Error(`DuckDB SQL generation did not complete (${finishReason})`);
    }
    const trimmed = text.trim();
    const dsl = (trimmed.match(/^```(?:sql|duckdb)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
    if (!dsl) throw new Error('DuckDB SQL generation returned an empty query');
    return { dsl, usage };
  }

  async validateDSL(sql: string): Promise<string> {
    // Share lazy initialization across validations; each call owns its connection.
    if (!this.parserInstance) {
      const pending = import('@duckdb/node-api').then(({ DuckDBInstance }) =>
        DuckDBInstance.create(':memory:', {
          threads: '1',
          memory_limit: '64MB',
          enable_external_access: 'false',
          allow_unsigned_extensions: 'false',
          allow_community_extensions: 'false',
          autoinstall_known_extensions: 'false',
          autoload_known_extensions: 'false',
        })
      );
      this.parserInstance = pending;
      void pending.catch(() => {
        if (this.parserInstance === pending) this.parserInstance = undefined;
      });
    }
    const instance = await this.parserInstance;
    const connection = await instance.connect();
    try {
      // The official serializer accepts SELECTs, including their CTEs and subqueries, without binding tables.
      // User SQL is a bound value; only the serializer/deserializer queries run in this data-free instance.
      // https://duckdb.org/docs/1.5/data/json/sql_to_and_from_json
      const reader = await connection.runAndReadAll('SELECT json_serialize_sql(CAST(? AS VARCHAR)) AS ast', [sql]);
      const serialized = reader.getRowObjectsJson()[0]?.ast;
      if (typeof serialized !== 'string') throw new Error('Missing DuckDB SQL validation result');
      const ast = JSON.parse(serialized) as { error: boolean; error_message?: string; statements?: unknown[] };
      if (ast.error !== false || ast.statements?.length !== 1) {
        throw new Error(
          `DuckDB query must contain exactly one read-only SELECT statement${
            ast.error_message ? `: ${ast.error_message}` : ''
          }`
        );
      }

      // Pass native JSON unchanged to preserve large numeric literals; deserialization removes statement trailers.
      const normalized = await connection.runAndReadAll('SELECT json_deserialize_sql(CAST(? AS JSON)) AS sql', [
        serialized,
      ]);
      const query = normalized.getRowObjectsJson()[0]?.sql;
      if (typeof query !== 'string' || !query) throw new Error('Missing normalized DuckDB SQL');
      return query;
    } finally {
      connection.closeSync();
    }
  }

  async dispose(): Promise<void> {
    const pending = this.parserInstance;
    this.parserInstance = undefined;
    // Initialization failures are already reported to validateDSL callers.
    const instance = await pending?.catch(() => undefined);
    instance?.closeSync();
  }
}
