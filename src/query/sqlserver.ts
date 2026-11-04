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
  /\b(?:into|insert|update|delete|merge|truncate|create|drop|alter|grant|revoke|backup|restore|attach|detach|shutdown|exec|execute|sp_[a-z0-9_]*)\b/i;

const FORBIDDEN_CLAUSES =
  /\b(?:bulk\s+insert|into\s+outfile|for\s+(?:xml|json)\s+(?:path|auto)|option\s*\(|readpast|readuncommitted|noexpand|holdlock|updlock|tablock)\b/i;

const UNION_PRECEDERS = new Set(['UNION', 'ALL', 'INTERSECT', 'EXCEPT']);

const STATEMENT_KEYWORDS = new Set([
  'INSERT',
  'UPDATE',
  'DELETE',
  'MERGE',
  'TRUNCATE',
  'CREATE',
  'DROP',
  'ALTER',
  'GRANT',
  'REVOKE',
  'BACKUP',
  'RESTORE',
  'EXEC',
  'EXECUTE',
  'DECLARE',
  'SET',
  'BEGIN',
  'USE',
  'SHUTDOWN',
  'IF',
  'WHILE',
]);

/**
 * Reject unbalanced parentheses and concatenated statements. T-SQL does not
 * require semicolons, so a stray `)` can otherwise close the engine's
 * row-limit wrapper early and append a second statement (e.g. SELECT INTO).
 */
function assertSingleBalancedStatement(stripped: string): void {
  const tokens = stripped.match(/\[[^\]]*\]|[()]|[A-Za-z_@#][A-Za-z0-9_@$#]*/g) ?? [];
  let depth = 0;
  let sawTopLevelSelect = false;
  let lastTopLevelWord = '';

  for (const token of tokens) {
    if (token === '(') {
      depth += 1;
      continue;
    }
    if (token === ')') {
      depth -= 1;
      if (depth < 0) {
        throw new Error('SQL Server query must contain exactly one balanced read-only SELECT statement');
      }
      continue;
    }
    // Bracketed identifiers are skipped so keywords inside them are ignored.
    if (token.startsWith('[')) continue;

    const word = token.toUpperCase();
    if (depth !== 0) continue;

    if (word === 'SELECT') {
      if (sawTopLevelSelect && !UNION_PRECEDERS.has(lastTopLevelWord)) {
        throw new Error('SQL Server query must contain exactly one read-only SELECT statement');
      }
      sawTopLevelSelect = true;
    } else if (STATEMENT_KEYWORDS.has(word)) {
      throw new Error('SQL Server query must be a read-only SELECT statement');
    }
    lastTopLevelWord = word;
  }

  if (depth !== 0) {
    throw new Error('SQL Server query must contain exactly one balanced read-only SELECT statement');
  }
}

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

  assertSingleBalancedStatement(stripped);

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

interface TsqlToken {
  value: string;
  upper: string;
  start: number;
  end: number;
  depth: number;
  kind: 'word' | 'number' | 'symbol';
}

/**
 * Tokenize just enough T-SQL to find the statement's top-level SELECT. Quoted
 * strings/identifiers and comments are skipped, including escaped delimiters.
 */
function scanTsql(sql: string): TsqlToken[] {
  const tokens: TsqlToken[] = [];
  let depth = 0;
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i + 2);
      i = end < 0 ? sql.length : end + 1;
      continue;
    }
    if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      if (end < 0) throw new Error('SQL Server query contains an unterminated comment');
      i = end + 2;
      continue;
    }
    if (ch === "'" || ch === '[' || ch === '"') {
      const close = ch === '[' ? ']' : ch;
      i += 1;
      let closed = false;
      while (i < sql.length) {
        if (sql[i] === close) {
          if (sql[i + 1] === close) {
            i += 2;
            continue;
          }
          i += 1;
          closed = true;
          break;
        }
        i += 1;
      }
      if (!closed) throw new Error('SQL Server query contains an unterminated quoted value');
      continue;
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ value: ch, upper: ch, start: i, end: ++i, depth, kind: 'symbol' });
      depth += ch === '(' ? 1 : -1;
      if (depth < 0) throw new Error('SQL Server query has unbalanced parentheses');
      continue;
    }
    const word = /^[A-Za-z_@#]/.test(ch);
    const number = /^[0-9]$/.test(ch);
    if (word || number) {
      const start = i;
      i += 1;
      while (i < sql.length && (word ? /[A-Za-z0-9_@$#]/ : /[0-9.]/).test(sql[i])) i += 1;
      const value = sql.slice(start, i);
      tokens.push({ value, upper: value.toUpperCase(), start, end: i, depth, kind: word ? 'word' : 'number' });
      continue;
    }
    tokens.push({ value: ch, upper: ch, start: i, end: ++i, depth, kind: 'symbol' });
  }
  if (depth !== 0) throw new Error('SQL Server query has unbalanced parentheses');
  return tokens;
}

/**
 * Bound the main SELECT with TOP rather than putting arbitrary T-SQL in a
 * derived table (which rejects CTEs and ORDER BY). Existing numeric TOP limits
 * are reduced when necessary. Forms whose meaning cannot be bounded safely by
 * this small rewrite are rejected explicitly instead of emitting invalid SQL.
 */
export function limitedTsqlQuery(sql: string, limit: number): string {
  if (!Number.isSafeInteger(limit) || limit < 0) throw new Error('SQL Server row limit must be a non-negative integer');
  const query = validateReadOnlySqlServer(sql);
  const bound = limit + 1;
  const tokens = scanTsql(query);
  const mainSelect = tokens.find((token) => token.depth === 0 && token.upper === 'SELECT');
  if (!mainSelect) throw new Error('SQL Server query must contain a top-level SELECT');

  if (tokens.some((token) => token.depth === 0 && ['UNION', 'INTERSECT', 'EXCEPT'].includes(token.upper))) {
    throw new Error('SQL Server row limiting does not support top-level UNION, INTERSECT, or EXCEPT');
  }
  if (tokens.some((token) => token.depth === 0 && ['OFFSET', 'FETCH'].includes(token.upper))) {
    throw new Error('SQL Server row limiting does not support OFFSET/FETCH; use a numeric TOP instead');
  }

  const mainIndex = tokens.indexOf(mainSelect);
  const modifier = tokens[mainIndex + 1];
  const hasModifier = modifier?.depth === 0 && ['DISTINCT', 'ALL'].includes(modifier.upper);
  const insertAt = hasModifier ? modifier.end : mainSelect.end;
  const topIndex = mainIndex + (hasModifier ? 2 : 1);
  const top = tokens[topIndex];

  if (top?.depth === 0 && top.upper === 'TOP') {
    let valueIndex = topIndex + 1;
    let parenthesized = false;
    if (tokens[valueIndex]?.value === '(') {
      parenthesized = true;
      valueIndex += 1;
    }
    const value = tokens[valueIndex];
    const after = tokens[valueIndex + 1];
    const validNumber = value?.kind === 'number' && /^\d+$/.test(value.value);
    if (!validNumber || (parenthesized && after?.value !== ')')) {
      throw new Error('SQL Server row limiting requires a literal integer TOP value');
    }
    const following = tokens[parenthesized ? valueIndex + 2 : valueIndex + 1];
    if (following?.upper === 'PERCENT' || following?.upper === 'WITH') {
      throw new Error('SQL Server row limiting does not support TOP PERCENT or WITH TIES');
    }
    const existing = Number(value.value);
    if (!Number.isSafeInteger(existing)) throw new Error('SQL Server TOP value is too large');
    return existing <= bound ? query : `${query.slice(0, value.start)}${bound}${query.slice(value.end)}`;
  }

  return `${query.slice(0, insertAt)} TOP (${bound})${query.slice(insertAt)}`;
}
