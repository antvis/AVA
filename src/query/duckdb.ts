import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { StatementType } from '@duckdb/node-api';

import { stringifySchema } from '../util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';
import type { LLMConfig, QueryDialect, Schema } from '../types';

export class DuckDBQueryDialect implements QueryDialect<DuckDBConnection> {
  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, schema: Schema): Promise<string> {
    const openai = createOpenAI({
      apiKey: this.llmConfig.apiKey,
      baseURL: this.llmConfig.baseURL,
    });

    const prompt = `You are a SQL expert. Given the following table schema and user query, generate a SQL query to answer the question.

Table Schema:
${stringifySchema(schema)}

User Query: ${query}

Generate ONLY the SQL query without any explanation or markdown formatting. Reference the tables by their exact names shown above (join them when the question spans multiple tables). Use DuckDB SQL syntax.`;

    const { text } = await generateText({
      model: openai(this.llmConfig.model) as any,
      prompt,
    });

    return text.trim().replace(/^```(?:sql)?\s*|\s*```$/gi, '').trim();
  }

  async validateDSL(sql: string, connection: DuckDBConnection): Promise<void> {
    const statements = await connection.extractStatements(sql);
    if (statements.count === 0) {
      throw new Error('DuckDB query must contain at least one statement');
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
  }
}
