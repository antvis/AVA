import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { TranslationResult, LLMConfig, QueryDialect, DataModel } from '../types';

/**
 * Defense-in-depth lexical checks for Snowflake SQL, not a security boundary or
 * a complete SQL parser. Every connection MUST use a dedicated primary role
 * restricted to read-only USAGE/SELECT privileges on approved objects, with no
 * write/DDL, procedure, stage, function, or sequence privileges. Server-side
 * authorization remains mandatory even when these local checks accept a query.
 */
type SnowflakeTokenKind = 'word' | 'quotedIdentifier' | 'string' | 'number' | 'symbol';

interface SnowflakeToken {
  kind: SnowflakeTokenKind;
  value: string;
  start: number;
  end: number;
  depth: number;
}

const NON_SELECT_STATEMENT_WORDS = new Set([
  'ALTER',
  'BEGIN',
  'CALL',
  'COMMIT',
  'COPY',
  'CREATE',
  'DELETE',
  'DESC',
  'DESCRIBE',
  'DROP',
  'EXECUTE',
  'GET',
  'GRANT',
  'INSERT',
  'LIST',
  'MERGE',
  'PUT',
  'REMOVE',
  'REVOKE',
  'ROLLBACK',
  'SET',
  'SHOW',
  'TRUNCATE',
  'UNDROP',
  'UPDATE',
  'USE',
]);

/** Words which can introduce a parenthesized query rather than a function call. */
const SUBQUERY_PREFIX_WORDS = new Set([
  'ALL',
  'AND',
  'ANY',
  'AS',
  'BY',
  'ELSE',
  'EXCEPT',
  'EXISTS',
  'FROM',
  'HAVING',
  'IN',
  'INTERSECT',
  'JOIN',
  'LATERAL',
  'MINUS',
  'NOT',
  'ON',
  'OR',
  'SELECT',
  'SOME',
  'THEN',
  'UNION',
  'VALUES',
  'WHEN',
  'WHERE',
  'WITH',
]);

const UNSUPPORTED_QUERY_FUNCTIONS = new Set(['RESULT_SCAN', 'CREATE_STATEMENT']);

function isIdentifier(token: SnowflakeToken | undefined): boolean {
  return token?.kind === 'word' || token?.kind === 'quotedIdentifier';
}

function isKeyword(token: SnowflakeToken | undefined, keyword: string): boolean {
  return token?.kind === 'word' && token.value.toUpperCase() === keyword;
}

function isSymbol(token: SnowflakeToken | undefined, symbol: string): boolean {
  return token?.kind === 'symbol' && token.value === symbol;
}

/**
 * Tokenize SQL while recognizing Snowflake quoted identifiers, single/dollar
 * quoted strings, and comments. The stripped form retains identifiers but
 * replaces literals and comments with whitespace for backwards compatibility.
 */
function scanSnowflakeSql(sql: string): { tokens: SnowflakeToken[]; stripped: string } {
  const tokens: SnowflakeToken[] = [];
  let stripped = '';
  let i = 0;

  const pushToken = (kind: SnowflakeTokenKind, value: string, start: number, end: number): void => {
    tokens.push({ kind, value, start, end, depth: 0 });
  };

  while (i < sql.length) {
    const ch = sql[i];
    if (/\s/.test(ch)) {
      stripped += ch;
      i += 1;
      continue;
    }

    if ((ch === '-' && sql[i + 1] === '-') || (ch === '/' && sql[i + 1] === '/')) {
      i += 2;
      while (i < sql.length && sql[i] !== '\n' && sql[i] !== '\r') i += 1;
      stripped += ' ';
      continue;
    }

    if (ch === '/' && sql[i + 1] === '*') {
      let commentDepth = 1;
      i += 2;
      while (i < sql.length && commentDepth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') {
          commentDepth += 1;
          i += 2;
        } else if (sql[i] === '*' && sql[i + 1] === '/') {
          commentDepth -= 1;
          i += 2;
        } else {
          i += 1;
        }
      }
      if (commentDepth !== 0) throw new Error('Invalid Snowflake SQL: unterminated block comment');
      stripped += ' ';
      continue;
    }

    if (ch === "'") {
      const start = i;
      i += 1;
      let closed = false;
      while (i < sql.length) {
        if (sql[i] === '\\' && i + 1 < sql.length) {
          // Snowflake accepts backslash escapes as well as doubled quotes.
          i += 2;
        } else if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            i += 2;
          } else {
            i += 1;
            closed = true;
            break;
          }
        } else {
          i += 1;
        }
      }
      if (!closed) throw new Error('Invalid Snowflake SQL: unterminated string literal');
      pushToken('string', sql.slice(start, i), start, i);
      stripped += ' ';
      continue;
    }

    if (ch === '$' && sql[i + 1] === '$') {
      const start = i;
      const close = sql.indexOf('$$', i + 2);
      if (close === -1) throw new Error('Invalid Snowflake SQL: unterminated dollar-quoted string');
      i = close + 2;
      pushToken('string', sql.slice(start, i), start, i);
      stripped += ' ';
      continue;
    }

    if (ch === '"') {
      const start = i;
      let value = '';
      let closed = false;
      i += 1;
      while (i < sql.length) {
        if (sql[i] === '"') {
          if (sql[i + 1] === '"') {
            value += '"';
            i += 2;
          } else {
            i += 1;
            closed = true;
            break;
          }
        } else {
          value += sql[i];
          i += 1;
        }
      }
      if (!closed) throw new Error('Invalid Snowflake SQL: unterminated quoted identifier');
      pushToken('quotedIdentifier', value, start, i);
      stripped += sql.slice(start, i);
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      i += 1;
      while (i < sql.length && /[A-Za-z0-9_$]/.test(sql[i])) i += 1;
      const value = sql.slice(start, i);
      pushToken('word', value, start, i);
      stripped += value;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const start = i;
      i += 1;
      while (i < sql.length && /[0-9]/.test(sql[i])) i += 1;
      const value = sql.slice(start, i);
      pushToken('number', value, start, i);
      stripped += value;
      continue;
    }

    pushToken('symbol', ch, i, i + 1);
    stripped += ch;
    i += 1;
  }

  return { tokens, stripped };
}

/** Strip comments and replace string literals with a placeholder. */
export function stripSqlComments(sql: string): string {
  return scanSnowflakeSql(sql).stripped;
}

interface NormalizedSnowflakeSql {
  sql: string;
  /** Significant tokens before optional trailing empty statements. */
  tokens: SnowflakeToken[];
}

/** Remove trailing terminators/comments without looking inside literals or quoted identifiers. */
function normalizeSnowflakeSql(sql: string): NormalizedSnowflakeSql {
  const source = sql.trim();
  const tokens = scanSnowflakeSql(source).tokens;
  let contentEnd = tokens.length;
  while (contentEnd > 0 && isSymbol(tokens[contentEnd - 1], ';')) contentEnd -= 1;
  if (contentEnd === 0) throw new Error('Snowflake query must not be empty');

  const contentTokens = tokens.slice(0, contentEnd);
  const lastToken = contentTokens[contentTokens.length - 1];
  return {
    sql: source.slice(0, lastToken.end).trim(),
    tokens: contentTokens,
  };
}

/** Record parenthesis nesting and pair opening parentheses with their closing token. */
function pairParentheses(tokens: SnowflakeToken[]): Map<number, number> {
  const closingByOpening = new Map<number, number>();
  const stack: number[] = [];
  let depth = 0;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (isSymbol(token, '(')) {
      token.depth = depth;
      stack.push(i);
      depth += 1;
    } else if (isSymbol(token, ')')) {
      const opening = stack.pop();
      if (opening === undefined) throw new Error('Invalid Snowflake SQL: unmatched closing parenthesis');
      depth -= 1;
      token.depth = depth;
      closingByOpening.set(opening, i);
    } else {
      token.depth = depth;
    }
  }

  if (stack.length > 0) throw new Error('Invalid Snowflake SQL: unmatched opening parenthesis');
  return closingByOpening;
}

function rejectReadOnly(): never {
  throw new Error('Snowflake query must be a read-only SELECT statement');
}

/** Validate the statement following a WITH clause and its CTE structure. */
function validateWithStatement(
  tokens: SnowflakeToken[],
  closingByOpening: Map<number, number>,
  withIndex: number
): void {
  const depth = tokens[withIndex].depth;
  let index = withIndex + 1;
  if (isKeyword(tokens[index], 'RECURSIVE') && tokens[index].depth === depth) index += 1;

  for (;;) {
    if (!isIdentifier(tokens[index]) || tokens[index].depth !== depth) rejectReadOnly();
    index += 1;

    // Optional CTE column list.
    if (isSymbol(tokens[index], '(') && tokens[index].depth === depth) {
      const closing = closingByOpening.get(index);
      if (closing === undefined) rejectReadOnly();
      index = closing + 1;
    }

    if (!isKeyword(tokens[index], 'AS') || tokens[index].depth !== depth) rejectReadOnly();
    index += 1;
    if (!isSymbol(tokens[index], '(') || tokens[index].depth !== depth) rejectReadOnly();
    const closing = closingByOpening.get(index);
    if (closing === undefined) rejectReadOnly();
    index = closing + 1;

    if (isSymbol(tokens[index], ',') && tokens[index].depth === depth) {
      index += 1;
      continue;
    }
    break;
  }

  // Snowflake also accepts parentheses around the main query.
  while (isSymbol(tokens[index], '(')) index += 1;
  if (!isKeyword(tokens[index], 'SELECT')) rejectReadOnly();
}

/** True when a token starts a statement in a parenthesized query, not a function argument. */
function isNestedStatementHead(tokens: SnowflakeToken[], index: number): boolean {
  if (!isSymbol(tokens[index - 1], '(')) return false;
  const beforeOpening = tokens[index - 2];
  if (!beforeOpening || isSymbol(beforeOpening, '(')) return true;
  if (beforeOpening.kind === 'word' && SUBQUERY_PREFIX_WORDS.has(beforeOpening.value.toUpperCase())) return true;
  return !isIdentifier(beforeOpening);
}

/**
 * NEXTVAL is sequence-advance syntax only as the terminal property of a dotted
 * identifier path. This avoids rejecting a column merely named "NEXTVAL" while
 * catching unquoted, mixed-case, qualified, and quoted sequence references.
 */
function isSequenceAdvance(tokens: SnowflakeToken[], index: number): boolean {
  const token = tokens[index];
  if (!isIdentifier(token) || token.value.toUpperCase() !== 'NEXTVAL') return false;
  if (!isSymbol(tokens[index - 1], '.') || !isIdentifier(tokens[index - 2])) return false;
  return !isSymbol(tokens[index + 1], '.');
}

/**
 * Validate that the DSL is a single, read-only Snowflake statement. Returns SQL
 * without trailing terminators/comments; throws for unsupported syntax. These
 * lexical checks complement, but never replace, the restricted role required on
 * the Snowflake connection.
 */
export function validateReadOnlySnowflake(sql: string): string {
  const normalized = normalizeSnowflakeSql(sql);
  const { tokens } = normalized;

  if (tokens.some((token) => isSymbol(token, ';'))) {
    throw new Error('Snowflake query must contain exactly one read-only SELECT statement');
  }

  const closingByOpening = pairParentheses(tokens);
  let headIndex = 0;
  while (isSymbol(tokens[headIndex], '(')) headIndex += 1;
  const head = tokens[headIndex];
  if (!isKeyword(head, 'SELECT') && !isKeyword(head, 'WITH')) rejectReadOnly();

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (isKeyword(token, 'WITH') && (i === headIndex || isSymbol(tokens[i - 1], '('))) {
      validateWithStatement(tokens, closingByOpening, i);
    }

    if (
      token.kind === 'word' &&
      NON_SELECT_STATEMENT_WORDS.has(token.value.toUpperCase()) &&
      !isSymbol(tokens[i + 1], '(') &&
      !isSymbol(tokens[i + 1], ')') &&
      isNestedStatementHead(tokens, i)
    ) {
      rejectReadOnly();
    }

    if (
      isIdentifier(token) &&
      UNSUPPORTED_QUERY_FUNCTIONS.has(token.value.toUpperCase()) &&
      isSymbol(tokens[i + 1], '(')
    ) {
      throw new Error('Snowflake query contains unsupported statements or clauses');
    }

    if (
      (isKeyword(token, 'INTO') && isKeyword(tokens[i + 1], 'OUTFILE')) ||
      (isKeyword(token, 'FOR') && isKeyword(tokens[i + 1], 'UPDATE'))
    ) {
      throw new Error('Snowflake query contains unsupported statements or clauses');
    }

    if (isSequenceAdvance(tokens, i)) {
      throw new Error('Snowflake read-only query must not advance a sequence with NEXTVAL');
    }
  }

  return normalized.sql;
}

export class SnowflakeQueryDialect implements QueryDialect<void> {
  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    const prompt = `You are a SQL expert. Given the following dataset profile and user query, generate a Snowflake SQL query to answer the question.

Dataset Context:
${stringifyDataModel(dataModel)}

User Query: ${query}

Generate exactly one read-only SELECT query (WITH is allowed), without explanation or markdown formatting. Do not use INSERT, UPDATE, DELETE, MERGE, TRUNCATE, DDL, CALL, stored procedures, stages, temporary tables, sequence NEXTVAL references, or RESULT_SCAN. Reference the tables and fields by their exact names shown above (join tables when the question spans multiple tables). Use Snowflake SQL syntax with double-quoted identifiers only where identifiers need quoting.`;

    const { text, usage } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });

    const trimmed = text.trim();
    const dsl = (trimmed.match(/^```(?:sql)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
    return { dsl, usage };
  }

  /** Apply local lexical checks; the restricted server-side role is still required. */
  async validateDSL(sql: string): Promise<string> {
    return validateReadOnlySnowflake(sql);
  }
}

/**
 * Wrap a read-only Snowflake statement with a row bound. Terminal semicolons
 * and trailing comments are removed lexically so they cannot comment out or
 * terminate the derived-table wrapper. One extra row signals truncation.
 */
export function limitedSnowflakeQuery(sql: string, limit: number): string {
  const query = normalizeSnowflakeSql(sql).sql;
  return `SELECT * FROM (\n${query}\n) AS __ava_query LIMIT ${limit + 1}`;
}
