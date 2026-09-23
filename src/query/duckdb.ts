import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { StatementType } from '@duckdb/node-api';

import { stringifyProfile, stringifySchema } from '../util/context';

import type { DuckDBConnection } from '@duckdb/node-api';
import type { LLMConfig, QueryDialect, DataContext } from '../types';

export class DuckDBQueryDialect implements QueryDialect<DuckDBConnection> {
  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, { schema, profile }: DataContext): Promise<string> {
    const openai = createOpenAI({
      apiKey: this.llmConfig.apiKey,
      baseURL: this.llmConfig.baseURL,
    });

    const prompt = `You are a SQL expert. Given the following dataset profile and user query, generate a SQL query to answer the question.

Dataset Context:
${profile ? stringifyProfile(profile) : stringifySchema(schema)}

User Query: ${query}

Generate ONLY the SQL query without any explanation or markdown formatting. Reference the tables and fields by their exact names shown above (join tables when the question spans multiple tables). Use DuckDB SQL syntax.`;

    const { text, usage } = await generateText({
      model: openai(this.llmConfig.model) as any,
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });
    this.llmConfig.onQueryUsage?.(usage);

    return text
      .trim()
      .replace(/^```(?:sql)?\s*|\s*```$/gi, '')
      .trim();
  }

  async validateDSL(sql: string, connection: DuckDBConnection): Promise<void> {
    const statements = await connection.extractStatements(sql);
    if (statements.count === 0) {
      throw new Error('DuckDB query must contain exactly one read-only SELECT statement');
    }

    for (let index = 0; index < statements.count; index += 1) {
      const statement = await statements.prepare(index);
      try {
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
  }
}
