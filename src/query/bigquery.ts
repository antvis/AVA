import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { TranslationResult, LLMConfig, DataModel, QueryDialect } from '../types';

/**
 * A conservative read-only guard for BigQuery GoogleSQL. A live project can
 * enforce this with a service account that owns only data reader roles; this
 * check keeps generated and user-supplied statements from being executed
 * blindly. It rejects multiple statements and any statement that is not a
 * plain read-only query.
 */
const MULTI_STATEMENT = /;[^;\s]|;(?=\s*(?:select|with|begin|set|exec|declare|insert|update|delete|merge|create|drop|alter|truncate|grant|revoke|call|export|load))/i;

const WRITE_KEYWORDS =
  /\b(?:insert|update|delete|merge|truncate|create|drop|alter|grant|revoke|grant|call|export|load|copy|declare|set|begin|commit|rollback|transaction|acquire|release)\b/i;

const FORBIDDEN_CLAUSES =
  /\b(?:insert\s+(?:into|overwrite)|into\s+outfile|using\s+external\s+table|option\s*\(|script\s+block|for\s+system_time)\b/i;

/**
 * Strip comments and replace string/identifier literals with a placeholder, so
 * keyword checks are reliable. GoogleSQL accepts single- and double-quoted
 * strings as well as backquoted identifiers; strings support both backslash
 * escapes and doubled delimiters, identifiers only doubled backticks.
 */
export function stripSqlComments(sql: string): string {
  let result = '';
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const ch = sql[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      result = `${result} `;
      i += 1;
      while (i < n) {
        if (quote !== '`' && sql[i] === '\\') {
          i += 2; // backslash escape (GoogleSQL string literal)
          continue;
        }
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            i += 2; // doubled delimiter
            continue;
          }
          i += 1; // closing delimiter
          break;
        }
        i += 1;
      }
    } else if (ch === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i + 2);
      result = `${result} `;
      i = end === -1 ? n : end + 1;
    } else if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      result = `${result} `;
    } else {
      result = `${result}${ch}`;
      i += 1;
    }
  }
  return result;
}

/**
 * Remove trailing comments and statement terminators from a GoogleSQL
 * statement. Comments and string literals are scanned so a `;` or `--` inside
 * a literal is preserved. The normalized statement is executed directly,
 * without a wrapper that could change top-level ORDER BY semantics.
 */
export function normalizeBigQueryStatement(sql: string): string {
  let last = -1;
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const ch = sql[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      last = i;
      i += 1;
      while (i < n) {
        if (quote !== '`' && sql[i] === '\\') {
          i += 2;
          last = i - 1;
          continue;
        }
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            i += 2;
            last = i - 1;
            continue;
          }
          last = i;
          i += 1;
          break;
        }
        last = i;
        i += 1;
      }
    } else if (ch === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i + 2);
      i = end === -1 ? n : end + 1;
    } else if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
    } else {
      if (!/\s/.test(ch)) last = i;
      i += 1;
    }
  }
  if (last < 0) return '';
  return sql.slice(0, last + 1).replace(/[;\s]+$/, '');
}

/**
 * Validate that the DSL is a single, read-only GoogleSQL statement. Returns the
 * normalized SQL; throws when the statement is unsafe or not read-only.
 * The SQL is later executed through the configured adapter, so genuine
 * server-side privilege constraints are still enforced on top.
 */
export function validateReadOnlyBigQuery(sql: string): string {
  const normalized = normalizeBigQueryStatement(sql);
  if (!normalized) throw new Error('BigQuery query must not be empty');

  const stripped = stripSqlComments(normalized);

  if (MULTI_STATEMENT.test(` ${stripped}`)) {
    throw new Error('BigQuery query must contain exactly one read-only SELECT statement');
  }

  if (WRITE_KEYWORDS.test(stripped) || FORBIDDEN_CLAUSES.test(stripped)) {
    throw new Error('BigQuery query must be a read-only SELECT statement');
  }

  const head = stripped.replace(/^\(\s*/i, '').trim();
  const isSelect = /^select\b/i.test(head);
  const isWith = /^with\b/i.test(head);
  if (!isSelect && !isWith) {
    throw new Error('BigQuery query must be a read-only SELECT statement');
  }

  return normalized;
}

export class BigQueryQueryDialect implements QueryDialect {
  readonly id = 'bigquery-sql';
  readonly rules = `Use GoogleSQL (BigQuery) syntax and exactly one read-only SELECT query (WITH is allowed).
  Reference the exact table and column names from the data model, joining tables when needed. Use backticks only where identifiers need quoting and single quotes for strings.
  Do not use INSERT, UPDATE, DELETE, MERGE, TRUNCATE, DDL, stored procedures, temporary tables, scripting, EXPORT DATA, or OPTIONS clauses. Apply ORDER BY at the outermost level when result order matters.`;

  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    const prompt = `You are a SQL expert. Given the following dataset profile and user query, generate a GoogleSQL (BigQuery) query to answer the question.

Dataset Context:
${stringifyDataModel(dataModel)}

User Query: ${query}

${this.rules}
Generate exactly one query. Return only SQL text, without explanation or Markdown.`;

    const { text, usage, finishReason } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });

    if (finishReason !== 'stop' && finishReason !== 'other') {
      throw new Error(`BigQuery SQL generation did not complete (${finishReason})`);
    }
    const trimmed = text.trim();
    const dsl = (trimmed.match(/^```(?:sql)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
    if (!dsl) throw new Error('BigQuery SQL generation returned an empty query');
    return { dsl, usage };
  }

  /** BigQuery has no server-side statement parser wired in, so validate locally. */
  async validateDSL(sql: string): Promise<string> {
    return validateReadOnlyBigQuery(sql);
  }
}
