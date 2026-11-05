import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { PgParser } from '@supabase/pg-parser';
import type { TranslationResult, LLMConfig, QueryDialect, DataModel } from '../types';

const MUTATING_NODES = new Set(['InsertStmt', 'UpdateStmt', 'DeleteStmt', 'MergeStmt']);

// SELECTs can create tables, lock rows, or contain data-modifying CTEs.
// https://www.postgresql.org/docs/17/sql-selectinto.html
// https://www.postgresql.org/docs/17/queries-with.html#QUERIES-WITH-MODIFYING
function containsWriteOrLock(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsWriteOrLock);
  if (!value || typeof value !== 'object') return false;

  const node = value as Record<string, unknown>;
  if (Object.keys(node).some((key) => MUTATING_NODES.has(key))) return true;
  if (node.intoClause) return true;
  if (Array.isArray(node.lockingClause) && node.lockingClause.length > 0) return true;
  return Object.values(node).some(containsWriteOrLock);
}

export class PostgreSQLDialect implements QueryDialect {
  private parser: PgParser | undefined;

  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    // Identifier quoting and set-operation scope follow PostgreSQL 17, matching the parser version.
    // https://www.postgresql.org/docs/17/sql-syntax-lexical.html
    // https://www.postgresql.org/docs/17/sql-select.html
    const prompt = `You are a PostgreSQL expert. Given the following data model and user query, generate a SQL query to answer the question.

    Dataset Context:
    ${stringifyDataModel(dataModel)}

    User Query: ${query}

    Generate exactly one read-only SELECT query (WITH is allowed). Return only SQL text.
    Use the exact table references and column names from the data model, joining tables when needed. Quote identifier components separately with double quotes when needed, preserving their case; use single quotes for strings.
    Use PostgreSQL syntax, functions and operators appropriate to the column types. Each CTE must also be read-only, and the query must return rows directly without INTO or row-locking clauses.
    UNION removes duplicates and UNION ALL preserves them; align columns by position and compatible types. Apply ORDER BY or LIMIT to the intended SELECT or combined set result, using parentheses when needed.`;

    const { text, usage, finishReason } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });

    if (finishReason !== 'stop' && finishReason !== 'other') {
      throw new Error(`PostgreSQL generation did not complete (${finishReason})`);
    }
    const trimmed = text.trim();
    const dsl = (trimmed.match(/^```(?:sql|postgresql)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
    if (!dsl) throw new Error('PostgreSQL generation returned an empty query');
    return { dsl, usage };
  }

  async validateDSL(sql: string): Promise<string> {
    // The underlying C parser stops at NUL; reject it so the entire input is validated.
    if (sql.includes('\0')) throw new Error('PostgreSQL query contains a NUL character');
    // Load and reuse the WASM parser only when SQL validation is needed.
    // https://github.com/supabase-community/pg-parser
    const { PgParser, unwrapParseResult } = await import('@supabase/pg-parser');
    this.parser ??= new PgParser({ version: 17 });
    const { stmts: statements = [] } = await unwrapParseResult(this.parser.parse(sql));
    const statement = statements[0]?.stmt;
    if (statements.length !== 1 || !statement || !('SelectStmt' in statement) || containsWriteOrLock(statement)) {
      throw new Error('PostgreSQL query must contain exactly one read-only SELECT statement without INTO or row locks');
    }

    // RawStmt ranges use UTF-8 bytes; length 0 means the rest of the input.
    // Preserve source text and comments while excluding empty statements and the terminator.
    // https://github.com/postgres/postgres/blob/REL_17_STABLE/src/include/nodes/parsenodes.h
    const { stmt_location: start = 0, stmt_len: length = 0 } = statements[0];
    const source = new TextEncoder().encode(sql);
    return new TextDecoder().decode(source.subarray(start, length ? start + length : undefined)).trim();
  }
}
