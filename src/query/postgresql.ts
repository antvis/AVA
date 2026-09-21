import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { PgParser, unwrapParseResult } from '@supabase/pg-parser';

import { stringifySchema } from '../util/schema';

import type { LLMConfig, QueryDialect, Schema } from '../types';

const MUTATING_NODES = new Set(['InsertStmt', 'UpdateStmt', 'DeleteStmt', 'MergeStmt']);

function containsMutation(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsMutation);
  if (!value || typeof value !== 'object') return false;

  const node = value as Record<string, unknown>;
  if (Object.keys(node).some((key) => MUTATING_NODES.has(key))) return true;
  if (Array.isArray(node.lockingClause) && node.lockingClause.length > 0) return true;
  return Object.values(node).some(containsMutation);
}

export class PostgreSQLQueryDialect implements QueryDialect {
  private readonly parser = new PgParser();

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

    const { text, usage } = await generateText({
      model: openai(this.llmConfig.model) as any,
      prompt,
    });
    this.llmConfig.onQueryUsage?.(usage);

    return text.trim().replace(/^```(?:sql)?\s*|\s*```$/gi, '').trim();
  }

  async validateDSL(sql: string): Promise<void> {
    const { stmts: statements = [] } = await unwrapParseResult(this.parser.parse(sql));
    if (statements.length === 0) {
      throw new Error('PostgreSQL query must contain at least one statement');
    }
    for (const { stmt: statement } of statements) {
      if (!statement || !('SelectStmt' in statement) || containsMutation(statement)) {
        throw new Error('PostgreSQL query must contain only read-only SELECT statements');
      }
    }
  }
}
