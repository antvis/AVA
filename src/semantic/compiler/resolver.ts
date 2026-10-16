/**
 * Deterministic parser for SMQ filter expressions. Only a closed grammar is accepted:
 * comparisons, IN, LIKE, BETWEEN and IS NULL over `<model>__<element>` references and
 * literals, combined with AND / OR / NOT and parentheses. Anything else is rejected.
 */
import type { SQLDialect } from './dialect';

type Token = { type: 'word' | 'string' | 'number' | 'op' | 'punct'; value: string };

const OPERATORS = ['<>', '!=', '>=', '<=', '=', '<', '>'];

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i += 1;
    } else if (ch === "'") {
      let value = '';
      i += 1;
      for (;;) {
        if (i >= input.length) throw new Error(`Unterminated string literal in filter: ${input}`);
        if (input[i] === "'") {
          if (input[i + 1] === "'") {
            value += "'";
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        value += input[i];
        i += 1;
      }
      tokens.push({ type: 'string', value });
    } else if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(input[i + 1] ?? ''))) {
      const match = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(input.slice(i))!;
      tokens.push({ type: 'number', value: match[0] });
      i += match[0].length;
    } else if (/[A-Za-z_]/.test(ch)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(input.slice(i))!;
      tokens.push({ type: 'word', value: match[0] });
      i += match[0].length;
    } else if (ch === '(' || ch === ')' || ch === ',') {
      tokens.push({ type: 'punct', value: ch });
      i += 1;
    } else {
      const op = OPERATORS.find((candidate) => input.startsWith(candidate, i));
      if (!op) throw new Error(`Unsupported character "${ch}" in filter: ${input}`);
      tokens.push({ type: 'op', value: op });
      i += op.length;
    }
  }

  return tokens;
}

export interface ParsedFilter {
  sql: string;
  /** Element references used by the filter. */
  refs: string[];
}

/** Parse and render one filter expression; `renderRef` resolves each reference to a SQL expression. */
export function parseFilter(input: string, dialect: SQLDialect, renderRef: (ref: string) => string): ParsedFilter {
  const tokens = tokenize(input);
  const refs: string[] = [];
  let pos = 0;

  const peek = () => tokens[pos];
  const keyword = (word: string) => peek()?.type === 'word' && peek().value.toUpperCase() === word;
  const fail = (message: string): never => {
    throw new Error(`Invalid filter "${input}": ${message}`);
  };
  const expectPunct = (value: string) => {
    if (peek()?.type !== 'punct' || peek().value !== value) fail(`expected "${value}"`);
    pos += 1;
  };
  const expectKeyword = (word: string) => {
    if (!keyword(word)) fail(`expected ${word}`);
    pos += 1;
  };

  const literal = (): string => {
    const token = tokens[pos];
    if (!token) return fail('expected a literal');
    pos += 1;
    if (token.type === 'string') return dialect.quoteString(token.value);
    if (token.type === 'number') return token.value;
    if (token.type === 'word') {
      const upper = token.value.toUpperCase();
      if (upper === 'TRUE' || upper === 'FALSE' || upper === 'NULL') return upper;
    }
    return fail(`expected a literal but found "${token.value}"`);
  };

  const predicate = (): string => {
    const token = tokens[pos];
    if (token?.type !== 'word') return fail('expected an element reference');
    pos += 1;
    refs.push(token.value);
    const left = renderRef(token.value);

    if (peek()?.type === 'op') {
      const op = tokens[pos++].value;
      return `${left} ${op === '!=' ? '<>' : op} ${literal()}`;
    }

    if (keyword('IS')) {
      pos += 1;
      const negated = keyword('NOT');
      if (negated) pos += 1;
      expectKeyword('NULL');
      return `${left} IS ${negated ? 'NOT ' : ''}NULL`;
    }

    const negated = keyword('NOT');
    if (negated) pos += 1;
    const not = negated ? 'NOT ' : '';

    if (keyword('IN')) {
      pos += 1;
      expectPunct('(');
      const values = [literal()];
      while (peek()?.type === 'punct' && peek().value === ',') {
        pos += 1;
        values.push(literal());
      }
      expectPunct(')');
      return `${left} ${not}IN (${values.join(', ')})`;
    }

    if (keyword('LIKE')) {
      pos += 1;
      return `${left} ${not}LIKE ${literal()}`;
    }

    if (keyword('BETWEEN')) {
      pos += 1;
      const low = literal();
      expectKeyword('AND');
      return `${left} ${not}BETWEEN ${low} AND ${literal()}`;
    }

    return fail('expected a comparison operator, IN, LIKE, BETWEEN or IS NULL');
  };

  const primary = (): string => {
    if (peek()?.type === 'punct' && peek().value === '(') {
      pos += 1;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const inner = or();
      expectPunct(')');
      return `(${inner})`;
    }
    return predicate();
  };

  const not = (): string => {
    if (keyword('NOT')) {
      pos += 1;
      return `NOT ${not()}`;
    }
    return primary();
  };

  const and = (): string => {
    const parts = [not()];
    while (keyword('AND')) {
      pos += 1;
      parts.push(not());
    }
    return parts.join(' AND ');
  };

  const or = (): string => {
    const parts = [and()];
    while (keyword('OR')) {
      pos += 1;
      parts.push(and());
    }
    return parts.join(' OR ');
  };

  if (tokens.length === 0) fail('empty expression');
  const sql = or();
  if (pos < tokens.length) fail(`unexpected token "${tokens[pos].value}"`);

  return { sql: refs.length > 1 || /\s(AND|OR)\s/.test(sql) ? `(${sql})` : sql, refs };
}
