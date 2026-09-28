import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyProfile, stringifySchema } from '../util/context';

import type { DataContext, LLMConfig, QueryDialect } from '../types';

const READ_ONLY_PREFIXES = new Set(['SELECT', 'WITH']);
const MUTATING_KEYWORDS = new Set([
  'ALTER',
  'ATTACH',
  'BACKUP',
  'CHECK',
  'CREATE',
  'DELETE',
  'DETACH',
  'DROP',
  'EXCHANGE',
  'GRANT',
  'INSERT',
  'KILL',
  'OPTIMIZE',
  'RENAME',
  'RESTORE',
  'REVOKE',
  'SET',
  'SYSTEM',
  'TRUNCATE',
  'UPDATE',
  'USE',
]);

/** Mask non-code spans without changing offsets, so execution can remove the real terminator. */
function maskSQL(sql: string): string {
  let out = '';
  let i = 0;
  while (i < sql.length) {
    const start = i;
    const ch = sql[i];
    const next = sql[i + 1];
    let literal = false;
    // https://clickhouse.com/docs/sql-reference/syntax#comments
    if (
      (ch === '-' && next === '-') ||
      (ch === '/' && next === '/') ||
      (ch === '#' && (next === ' ' || next === '!'))
    ) {
      while (i < sql.length && sql[i] !== '\n') i += 1;
    } else if (ch === '/' && next === '*') {
      let depth = 1;
      i += 2;
      while (i < sql.length && depth) {
        if (sql[i] === '/' && sql[i + 1] === '*') {
          depth += 1;
          i += 2;
        } else if (sql[i] === '*' && sql[i + 1] === '/') {
          depth -= 1;
          i += 2;
        } else {
          i += 1;
        }
      }
      if (depth) throw new Error('Unterminated ClickHouse comment');
    } else if (ch === "'" || ch === '"' || ch === '`') {
      // Strings and quoted identifiers share backslash and doubled-quote escaping.
      // https://clickhouse.com/docs/sql-reference/syntax#string
      // https://clickhouse.com/docs/sql-reference/syntax#identifiers
      literal = true;
      i += 1;
      let closed = false;
      while (i < sql.length) {
        if (sql[i] === '\\' || (sql[i] === ch && sql[i + 1] === ch)) {
          i += 2;
        } else if (sql[i++] === ch) {
          closed = true;
          break;
        }
      }
      if (!closed) throw new Error('Unterminated ClickHouse quoted value');
    } else if (ch === '$' && /^\$\w*\$/.test(sql.slice(i))) {
      // Heredoc contents are literal: neither quotes nor backslashes are escapes.
      // https://clickhouse.com/docs/sql-reference/syntax#heredoc
      literal = true;
      const delimiter = sql.slice(i).match(/^\$\w*\$/)![0];
      const end = sql.indexOf(delimiter, i + delimiter.length);
      if (end === -1) throw new Error('Unterminated ClickHouse heredoc');
      i = end + delimiter.length;
    } else {
      const word = sql.slice(i).match(/^[A-Za-z0-9_][A-Za-z0-9_$]*/)?.[0] ?? ch;
      out += word;
      i += word.length;
      continue;
    }
    // Keep literals significant; a quoted SELECT must not become a statement prefix.
    out += (literal ? '?' : ' ') + ' '.repeat(i - start - 1);
  }
  return out;
}

export class ClickHouseQueryDialect implements QueryDialect {
  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, { schema, profile }: DataContext): Promise<string> {
    const prompt = `You are a SQL expert. Given the following dataset profile and user query, generate a SQL query to answer the question.

Dataset Context:
${profile ? stringifyProfile(profile) : stringifySchema(schema)}

User Query: ${query}

Generate exactly one read-only SELECT query (WITH is allowed), without explanation or markdown formatting. Do not use INTO OUTFILE, FORMAT, or PARALLEL WITH. Reference the tables and fields by their exact names shown above (join tables when the question spans multiple tables). Use ClickHouse SQL syntax.`;

    const { text, usage } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });
    this.llmConfig.onQueryUsage?.(usage);

    const trimmed = text.trim();
    return (trimmed.match(/^```(?:sql)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
  }

  async validateDSL(sql: string): Promise<void> {
    this.prepareQuery(sql);
  }

  /** Validate and remove the terminator before the engine wraps this query in a subquery. */
  prepareQuery(sql: string): string {
    const masked = maskSQL(sql);
    const terminator = masked.indexOf(';');
    const statement = terminator < 0 ? masked : masked.slice(0, terminator);
    if (!statement.trim() || (terminator >= 0 && masked.slice(terminator + 1).trim())) {
      throw new Error('ClickHouse query must contain exactly one read-only SELECT statement');
    }

    const tokens = statement.match(/[A-Za-z_][A-Za-z0-9_]*|[^\s]/g)?.map((token) => token.toUpperCase()) ?? [];
    // ponytail: lexical guard, not a SQL parser; server parsing and a SELECT-only account
    // remain necessary. Quote keyword identifiers to avoid this conservative denylist.
    // https://clickhouse.com/docs/sql-reference/syntax#keywords
    if (!READ_ONLY_PREFIXES.has(tokens[0]) || tokens.some((token) => MUTATING_KEYWORDS.has(token))) {
      throw new Error('ClickHouse query must contain only read-only SELECT statements');
    }
    // SELECT can have output clauses or be combined with another statement.
    // https://clickhouse.com/docs/sql-reference/statements/select#syntax
    // https://clickhouse.com/docs/sql-reference/statements/parallel_with
    if (/\bINTO\s+OUTFILE\b|\bPARALLEL\s+WITH\b/i.test(statement)) {
      throw new Error('ClickHouse query must contain only read-only SELECT statements');
    }
    let depth = 0;
    let hasSelect = false;
    for (const token of tokens) {
      if (token === '(') depth += 1;
      if (token === ')') depth -= 1;
      if (depth < 0) throw new Error('Unbalanced ClickHouse query parentheses');
      if (depth === 0 && token === 'SELECT') hasSelect = true;
    }
    if (depth !== 0) throw new Error('Unbalanced ClickHouse query parentheses');
    if (!hasSelect) throw new Error('ClickHouse query must contain only read-only SELECT statements');
    return (terminator < 0 ? sql : sql.slice(0, terminator)).trim();
  }
}
