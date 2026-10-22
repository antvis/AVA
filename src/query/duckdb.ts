import { generateText } from 'ai';
import { StatementType } from '@duckdb/node-api';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { DuckDBConnection } from '@duckdb/node-api';
import type { LLMConfig, QueryDialect, DataModel } from '../types';

const MUTATING_NODES = new Set(['INSERT_QUERY_NODE', 'UPDATE_QUERY_NODE', 'DELETE_QUERY_NODE', 'COPY_QUERY_NODE']);

function containsMutation(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsMutation);
  if (!value || typeof value !== 'object') return false;

  const node = value as Record<string, unknown>;
  if (typeof node.type === 'string' && MUTATING_NODES.has(node.type)) return true;
  return Object.values(node).some(containsMutation);
}

export class DuckDBQueryDialect implements QueryDialect<DuckDBConnection> {
  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, dataModel: DataModel): Promise<string> {
    const prompt = `You are a SQL expert. Given the following dataset profile and user query, generate a SQL query to answer the question.

Dataset Context:
${stringifyDataModel(dataModel)}

User Query: ${query}

Generate exactly one read-only SELECT query (WITH is allowed), without explanation or markdown formatting. Never use data-modifying CTEs (INSERT, UPDATE, DELETE, COPY).
Use DuckDB 2.0 SQL syntax and the exact table and column names and data types provided above. Join tables when needed to answer the question.
When using lambda expressions, use Python-style syntax, for example list_transform([1, 2, 3], lambda x: x + 1).`;

    const { text, usage } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });
    this.llmConfig.onQueryUsage?.(usage);

    return text
      .trim()
      .replace(/^```(?:sql)?\s*|\s*```$/gi, '')
      .trim();
  }

  async validateDSL(sql: string, connection: DuckDBConnection): Promise<string> {
    // Execution wraps one query in a subquery to limit rows and returns a single result set.
    const statements = await connection.extractStatements(sql);
    if (statements.count === 0) {
      throw new Error('DuckDB query must contain exactly one read-only SELECT statement');
    }

    for (let index = 0; index < statements.count; index += 1) {
      const statement = await statements.prepare(index);
      try {
        // The outer statement must be SELECT; this alone does not guarantee its CTEs are read-only.
        if (statement.statementType !== StatementType.SELECT) {
          throw new Error('DuckDB query must contain only read-only SELECT statements');
        }
      } finally {
        statement.destroySync();
      }
    }
    if (statements.count !== 1) {
      throw new Error('DuckDB query must contain exactly one read-only SELECT statement');
    }
    // DuckDB 2.0 labels SELECTs with mutating CTEs as SELECT too, so inspect the nested AST nodes.
    const reader = await connection.runAndReadAll('SELECT json_serialize_sql($1) AS ast', [sql]);
    const ast = JSON.parse(reader.getRowObjectsJson()[0].ast as string);
    if (ast.error || containsMutation(ast)) {
      throw new Error('DuckDB query must contain only read-only SELECT statements');
    }
    return sql;
  }
}
