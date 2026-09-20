import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { parse } from 'pgsql-ast-parser';

import { stringifySchema } from '../util/schema';

import type { LLMConfig, QueryDialect, Schema } from '../types';
import type { Statement } from 'pgsql-ast-parser';

function isReadOnly(statement: Statement): boolean {
  switch (statement.type) {
    case 'select':
      return !statement.for;
    case 'values':
      return true;
    case 'union':
    case 'union all':
      return isReadOnly(statement.left) && isReadOnly(statement.right);
    case 'with':
      return statement.bind.every((binding) => isReadOnly(binding.statement))
        && isReadOnly(statement.in);
    case 'with recursive':
      return isReadOnly(statement.bind) && isReadOnly(statement.in);
    default:
      return false;
  }
}

export class PostgreSQLQueryDialect implements QueryDialect {
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

Generate ONLY the SQL query without any explanation or markdown formatting. Reference the tables by their exact names shown above (join them when the question spans multiple tables). Use PostgreSQL SQL syntax.`;

    const { text } = await generateText({
      model: openai(this.llmConfig.model) as any,
      prompt,
    });

    return text.trim().replace(/^```(?:sql)?\s*|\s*```$/gi, '').trim();
  }

  async validateDSL(sql: string): Promise<void> {
    const statements = parse(sql);
    if (statements.length !== 1) {
      throw new Error('PostgreSQL query must contain exactly one statement');
    }
    if (!isReadOnly(statements[0])) {
      throw new Error('PostgreSQL query must be read-only SELECT');
    }
  }
}
