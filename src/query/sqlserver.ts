import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { TranslationResult, LLMConfig, QueryDialect, DataModel } from '../types';

/**
 * A conservative read-only guard for T-SQL. A live server could enforce this
 * with a login that owns only SELECT privileges; this check keeps generated
 * and user-supplied statements from being executed blindly. It rejects
 * multiple statements and any statement that is not a plain read-only query.
 */
const MULTI_STATEMENT = /;[^;\s]|;(?=\s*(?:select|with|begin|set|exec|declare|insert|update|delete|create|drop|alter|truncate|merge|grant|revoke|backup|shutdown))/i;

const WRITE_KEYWORDS =
  /\b(?:insert|update|delete|merge|truncate|create|drop|alter|grant|revoke|backup|restore|attach|detach|shutdown|exec|execute|sp_[a-z0-9_]*)\b/i;

const FORBIDDEN_CLAUSES =
  /\b(?:bulk\s+insert|into\s+outfile|for\s+(?:xml|json)\s+(?:path|auto)|option\s*\(|readpast|readuncommitted|noexpand|holdlock|updlock|tablock)\b/i;

/** Strip comments and replace string literals with a placeholder, so keyword checks are reliable. */
export function stripSqlComments(sql: string): string {
  let result = '';
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (ch === "'") {
      // Consume optional N-prefix and a quoted literal; blank them as a placeholder.
      result = `${result} `;
      i += 1;
      while (i < sql.length && sql[i] !== "'") i += 1;
      i += 1; // closing quote (or end)
    } else if (ch === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i + 2);
      result = `${result} `;
      i = end === -1 ? sql.length : end + 1;
    } else if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? sql.length : end + 2;
      result = `${result} `;
    } else {
      result = `${result}${ch}`;
      i += 1;
    }
  }
  return result;
}

/**
 * Validate that the DSL is a single, read-only T-SQL statement. Returns the
 * normalized SQL; throws when the statement is unsafe or not read-only.
 * The SQL is later executed under the connection configured with the adapter,
 * so genuine server-side privilege constraints are still enforced on top.
 */
export function validateReadOnlySqlServer(sql: string): string {
  const trimmed = sql.trim().replace(/;+\s*$/, '');
  if (!trimmed) throw new Error('SQL Server query must not be empty');

  const stripped = stripSqlComments(trimmed);

  if (MULTI_STATEMENT.test(` ${stripped}`)) {
    throw new Error('SQL Server query must contain exactly one read-only SELECT statement');
  }

  if (FORBIDDEN_CLAUSES.test(stripped)) {
    throw new Error('SQL Server query contains unsupported statements or clauses');
  }

  const head = stripped.replace(/^\(\)*\s*/i, '').trim();
  const isSelect = /^select\b/i.test(head);
  const isWith = /^with\b/i.test(head);
  if (!isSelect && !isWith) {
    throw new Error('SQL Server query must be a read-only SELECT statement');
  }

  if (WRITE_KEYWORDS.test(stripped)) {
    throw new Error('SQL Server query must be a read-only SELECT statement');
  }

  return trimmed;
}

export class SqlServerQueryDialect implements QueryDialect<void> {
  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    const prompt = `You are a SQL expert. Given the following dataset profile and user query, generate a T-SQL query to answer the question.

Dataset Context:
${stringifyDataModel(dataModel)}

User Query: ${query}

Generate exactly one read-only SELECT query (WITH is allowed), without explanation or markdown formatting. Do not use INSERT, UPDATE, DELETE, MERGE, TRUNCATE, DDL, EXEC, stored procedures, temporary tables, or OPTION clauses. Reference the tables and fields by their exact names shown above (join tables when the question spans multiple tables). Use Microsoft SQL Server T-SQL syntax with [brackets] only where identifiers need quoting.`;

    const { text, usage } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });

    const trimmed = text.trim();
    const dsl = (trimmed.match(/^```(?:sql)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
    return { dsl, usage };
  }

  /** SQL Server has no server-side statement parser wired in, so validate locally. */
  async validateDSL(sql: string): Promise<string> {
    return validateReadOnlySqlServer(sql);
  }
}

/**
 * Wrap a read-only T-SQL statement with a row bound. SQL Server has no
 * standard `LIMIT`; `TOP` applied to a derived table keeps statement order
 * while bounding the result (one extra row signals truncation).
 */
export function limitedTsqlQuery(sql: string, limit: number): string {
  const query = sql.trim().replace(/;+\s*$/, '');
  return `SELECT TOP (${limit + 1}) * FROM (\n${query}\n) AS __ava_query`;
}