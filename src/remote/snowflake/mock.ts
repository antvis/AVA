/**
 * Built-in in-memory Snowflake connector. It seeds `INFORMATION_SCHEMA` views
 * from the configured `tables` and runs the read-only SQL needed by schema
 * discovery, profiling, examples, and tests. It is deliberately not a complete
 * SQL engine; unsupported syntax is rejected instead of being ignored.
 */
import { sqlIdentifier, sqlStringLiteral } from '../../util/sql';

import type { SnowflakeSourceOptions } from '../../types';
import type { QueryConnector, QueryResult, QueryResultRow } from './connector';

const DEFAULT_SCHEMA = 'PUBLIC';

interface Column {
  name: string;
  type: string;
  notNull: boolean;
}

interface Table {
  name: string;
  schema: string;
  columns: Column[];
  rows: Record<string, unknown>[];
  primaryKey?: string[];
}

/** Normalize an identifier path: strip quotes, take the last segment, upper-case. */
function lastIdent(qualified: string): string {
  const cleaned = qualified.replace(/["`]/g, '');
  const segments = cleaned.split('.').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

function identParts(qualified: string): string[] {
  return qualified
    .replace(/["`]/g, '')
    .split('.')
    .filter(Boolean)
    .map((part) => part.toUpperCase());
}

/** Ordering-only comparison. SQL predicate comparisons handle NULL separately. */
function comparable(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const av = String(a);
  const bv = String(b);
  return av === bv ? 0 : av < bv ? -1 : 1;
}

function valueKey(value: unknown): string {
  if (value === null) return 'null:';
  if (value === undefined) return 'undefined:';
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'number:NaN';
    if (Object.is(value, -0)) return 'number:0';
    return `number:${String(value)}`;
  }
  if (value instanceof Date) return `date:${value.toISOString()}`;
  if (typeof value === 'object') return `object:${JSON.stringify(value)}`;
  return `${typeof value}:${String(value)}`;
}

function rowKey(row: Record<string, unknown>): string {
  return JSON.stringify(Object.entries(row).map(([key, value]) => [key, valueKey(value)]));
}

/** Build INFORMATION_SCHEMA catalog views seeded from a concrete table list. */
function makeCatalog(db: string, tables: Table[]): Table[] {
  const tabs: Record<string, unknown>[] = tables.map((t) => ({
    TABLE_CATALOG: db,
    TABLE_SCHEMA: t.schema,
    TABLE_NAME: t.name,
    TABLE_TYPE: 'BASE TABLE',
  }));
  const cols: Record<string, unknown>[] = tables.flatMap((t) =>
    t.columns.map((c, i) => ({
      TABLE_CATALOG: db,
      TABLE_SCHEMA: t.schema,
      TABLE_NAME: t.name,
      COLUMN_NAME: c.name,
      DATA_TYPE: c.type,
      IS_NULLABLE: c.notNull ? 'NO' : 'YES',
      ORDINAL_POSITION: i + 1,
    }))
  );
  const keyUsage: Record<string, unknown>[] = tables.flatMap((t) =>
    (t.primaryKey ?? []).map((column, i) => ({
      TABLE_CATALOG: db,
      TABLE_SCHEMA: t.schema,
      TABLE_NAME: t.name,
      COLUMN_NAME: column,
      CONSTRAINT_NAME: `PK_${t.name}`,
      ORDINAL_POSITION: i + 1,
    }))
  );

  return [
    {
      name: 'INFORMATION_SCHEMA.TABLES',
      schema: 'INFORMATION_SCHEMA',
      columns: [
        { name: 'TABLE_CATALOG', type: 'VARCHAR', notNull: true },
        { name: 'TABLE_SCHEMA', type: 'VARCHAR', notNull: true },
        { name: 'TABLE_NAME', type: 'VARCHAR', notNull: true },
        { name: 'TABLE_TYPE', type: 'VARCHAR', notNull: true },
      ],
      rows: tabs,
    },
    {
      name: 'INFORMATION_SCHEMA.COLUMNS',
      schema: 'INFORMATION_SCHEMA',
      columns: [
        { name: 'TABLE_CATALOG', type: 'VARCHAR', notNull: true },
        { name: 'TABLE_SCHEMA', type: 'VARCHAR', notNull: true },
        { name: 'TABLE_NAME', type: 'VARCHAR', notNull: true },
        { name: 'COLUMN_NAME', type: 'VARCHAR', notNull: true },
        { name: 'DATA_TYPE', type: 'VARCHAR', notNull: true },
        { name: 'IS_NULLABLE', type: 'VARCHAR', notNull: true },
        { name: 'ORDINAL_POSITION', type: 'INTEGER', notNull: true },
      ],
      rows: cols,
    },
    {
      name: 'INFORMATION_SCHEMA.KEY_COLUMN_USAGE',
      schema: 'INFORMATION_SCHEMA',
      columns: [
        { name: 'TABLE_CATALOG', type: 'VARCHAR', notNull: true },
        { name: 'TABLE_SCHEMA', type: 'VARCHAR', notNull: true },
        { name: 'TABLE_NAME', type: 'VARCHAR', notNull: true },
        { name: 'COLUMN_NAME', type: 'VARCHAR', notNull: true },
        { name: 'CONSTRAINT_NAME', type: 'VARCHAR', notNull: true },
        { name: 'ORDINAL_POSITION', type: 'INTEGER', notNull: true },
      ],
      rows: keyUsage,
    },
  ];
}

// ── tiny tokenizer / parser for the supported SELECT subset ───────────────
type Token = { t: 'word' | 'string' | 'number' | 'sym'; v: string; quoted?: boolean };

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const ch = sql[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === "'") {
      let value = '';
      i += 1;
      let closed = false;
      while (i < n) {
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            value += "'";
            i += 2;
            continue;
          }
          i += 1;
          closed = true;
          break;
        }
        value += sql[i];
        i += 1;
      }
      if (!closed) throw new Error('Unterminated string literal in Snowflake statement');
      tokens.push({ t: 'string', v: value });
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9.]/.test(sql[j])) j += 1;
      tokens.push({ t: 'number', v: sql.slice(i, j) });
      i = j;
      continue;
    }
    if (ch === '@') {
      // Stage references are not readable table sources. Consume the complete
      // token so malformed input can never leave the tokenizer stuck at `@`.
      let j = i + 1;
      while (j < n && /[a-zA-Z0-9_$.]/.test(sql[j])) j += 1;
      tokens.push({ t: 'sym', v: sql.slice(i, j) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_"`]/.test(ch)) {
      let value = '';
      if (ch === '"' || ch === '`') {
        const close = ch;
        i += 1;
        let closed = false;
        for (; i < n; i++) {
          if (sql[i] === close) {
            if (sql[i + 1] === close) {
              value += close;
              i += 1;
              continue;
            }
            i += 1;
            closed = true;
            break;
          }
          value += sql[i];
        }
        if (!closed) throw new Error('Unterminated quoted identifier in Snowflake statement');
        tokens.push({ t: 'word', v: value, quoted: true });
        continue;
      }
      while (i < n && /[a-zA-Z0-9_$]/.test(sql[i])) {
        value += sql[i];
        i += 1;
      }
      tokens.push({ t: 'word', v: value });
      continue;
    }
    const pair = sql.slice(i, i + 2);
    if (['<=', '>=', '<>', '!=', '||', '::'].includes(pair)) {
      tokens.push({ t: 'sym', v: pair });
      i += 2;
      continue;
    }
    if (pair === '/*') {
      const end = sql.indexOf('*/', i + 2);
      if (end === -1) throw new Error('Unterminated comment in Snowflake statement');
      i = end + 2;
      continue;
    }
    if (ch === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i + 2);
      i = end === -1 ? n : end + 1;
      continue;
    }
    tokens.push({ t: 'sym', v: ch });
    i += 1;
  }
  return tokens;
}

interface ParsedSelect {
  items: SelectItem[];
  distinct: boolean;
  limit?: number;
  from?: string;
  source?: ParsedSelect;
  where?: Expr;
  groupBy: Expr[];
  having?: Expr;
  orderBy: { expr: Expr; dir: 'ASC' | 'DESC' }[];
}

interface SelectItem {
  expr: Expr;
  alias: string;
  isStar: boolean;
}

interface Expr {
  kind: 'ident' | 'literal' | 'call' | 'star' | 'binary' | 'unary' | 'case' | 'cast' | 'select';
  value?: unknown;
  name?: string;
  /** Original spelling of the last identifier segment, for preserving output case. */
  orig?: string;
  args?: Expr[];
  distinct?: boolean;
  left?: Expr;
  right?: Expr;
  op?: string;
  whens?: { condition: Expr; result: Expr }[];
  elseExpr?: Expr;
  castType?: string;
  select?: ParsedSelect;
  withinGroup?: { expr: Expr; dir: 'ASC' | 'DESC' }[];
}

/** Unwrap the engine's `SELECT * FROM ( <inner> ) AS __ava_query LIMIT N` wrapper. */
function unwrapWrapper(sql: string): { inner: string; limit?: number } {
  const m = sql.match(/^SELECT\s+\*\s+FROM\s*\(\s*([\s\S]+?)\s*\)\s+AS\s+\w+\s+LIMIT\s+(\d+)\s*$/i);
  if (!m) return { inner: sql };
  return { inner: m[1], limit: Number(m[2]) };
}

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  private peek(o = 0): Token | undefined {
    return this.tokens[this.pos + o];
  }
  private next(): Token {
    const t = this.tokens[this.pos];
    if (!t) throw new Error('Unexpected end of Snowflake statement');
    this.pos += 1;
    return t;
  }
  private is(w: string): boolean {
    const t = this.peek();
    return t?.t === 'word' && !t.quoted && t.v.toUpperCase() === w.toUpperCase();
  }
  private kw(w: string): void {
    const t = this.next();
    if (t.t !== 'word' || t.quoted || t.v.toUpperCase() !== w.toUpperCase()) {
      throw new Error(`Expected "${w}"`);
    }
  }
  private sym(value: string): boolean {
    const token = this.peek();
    return token?.t === 'sym' && token.v === value;
  }
  private expectSym(value: string): void {
    const token = this.next();
    if (token.t !== 'sym' || token.v !== value) throw new Error(`Expected "${value}", got "${token.v}"`);
  }

  parse(): ParsedSelect {
    const parsed = this.parseSelect();
    if (this.peek()) throw new Error(`Unsupported Snowflake syntax near "${this.peek()?.v}"`);
    return parsed;
  }

  private parseSelect(): ParsedSelect {
    this.kw('SELECT');
    const distinct = this.is('DISTINCT');
    if (distinct) this.next();

    const items: SelectItem[] = [];
    for (;;) {
      items.push(this.parseItem());
      if (this.sym(',')) {
        this.next();
        continue;
      }
      break;
    }

    let from: string | undefined;
    let source: ParsedSelect | undefined;
    if (this.is('FROM')) {
      this.next();
      if (this.sym('(')) {
        this.next();
        if (!this.is('SELECT')) throw new Error('Only SELECT subqueries are supported in FROM');
        source = this.parseSelect();
        this.expectSym(')');
      } else {
        const first = this.peek();
        if (first?.t === 'sym' && first.v.startsWith('@')) {
          throw new Error('Stage references are not supported by the mock Snowflake connector');
        }
        from = this.qualifiedName();
      }
      // Optional table alias. Dotted identifiers are folded to their final
      // segment during evaluation, so the alias does not change row storage.
      if (this.is('AS')) {
        this.next();
        if (this.next().t !== 'word') throw new Error('Expected a table alias');
      } else if (this.peek()?.t === 'word' && !this.isKeyword(this.peek()!.v, this.peek()!.quoted)) {
        this.next();
      }
    }

    const where = this.is('WHERE') ? (this.next(), this.parseExpression()) : undefined;

    const groupBy: Expr[] = [];
    if (this.is('GROUP')) {
      this.kw('GROUP');
      this.kw('BY');
      for (;;) {
        groupBy.push(this.parseExpression());
        if (this.sym(',')) {
          this.next();
          continue;
        }
        break;
      }
    }

    const having = this.is('HAVING') ? (this.next(), this.parseExpression()) : undefined;

    const orderBy: { expr: Expr; dir: 'ASC' | 'DESC' }[] = [];
    if (this.is('ORDER')) {
      this.kw('ORDER');
      this.kw('BY');
      for (;;) {
        const expr = this.parseExpression();
        let dir: 'ASC' | 'DESC' = 'ASC';
        if (this.is('ASC')) this.next();
        else if (this.is('DESC')) {
          this.next();
          dir = 'DESC';
        }
        orderBy.push({ expr, dir });
        if (this.sym(',')) {
          this.next();
          continue;
        }
        break;
      }
    }

    let limit: number | undefined;
    if (this.is('LIMIT')) {
      this.kw('LIMIT');
      const token = this.next();
      limit = Number(token.v);
      if (token.t !== 'number' || !Number.isSafeInteger(limit) || limit < 0) {
        throw new Error('LIMIT must be a non-negative safe integer');
      }
    }

    return { items, distinct, limit, from, source, where, groupBy, having, orderBy };
  }

  private isKeyword(word: string, quoted = false): boolean {
    if (quoted) return false;
    return [
      'FROM',
      'WHERE',
      'GROUP',
      'ORDER',
      'HAVING',
      'LIMIT',
      'AND',
      'OR',
      'AS',
      'ASC',
      'DESC',
      'BY',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
      'IS',
      'NOT',
      'DISTINCT',
      'WITHIN',
    ].includes(word.toUpperCase());
  }

  private parseItem(): SelectItem {
    const expr = this.parseExpression();
    let alias = '';
    if (this.is('AS')) {
      this.next();
      const token = this.next();
      if (token.t !== 'word') throw new Error('Expected a SELECT alias');
      alias = token.v;
    } else if (this.peek()?.t === 'word' && !this.isKeyword(this.peek()!.v, this.peek()!.quoted)) {
      alias = this.next().v;
    }
    return { expr, alias, isStar: expr.kind === 'star' };
  }

  private parseExpression(): Expr {
    return this.parseOr();
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.is('OR')) {
      this.next();
      left = { kind: 'binary', op: 'OR', left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseNot();
    while (this.is('AND')) {
      this.next();
      left = { kind: 'binary', op: 'AND', left, right: this.parseNot() };
    }
    return left;
  }

  private parseNot(): Expr {
    if (this.is('NOT')) {
      this.next();
      return { kind: 'unary', op: 'NOT', left: this.parseNot() };
    }
    return this.parseComparison();
  }

  private parseComparison(): Expr {
    const left = this.parseConcat();
    if (this.is('IS')) {
      this.next();
      const not = this.is('NOT');
      if (not) this.next();
      this.kw('NULL');
      return { kind: 'binary', op: not ? 'IS NOT NULL' : 'IS NULL', left };
    }
    const token = this.peek();
    if (token?.t === 'sym' && ['=', '<>', '!=', '<', '>', '<=', '>='].includes(token.v)) {
      this.next();
      return { kind: 'binary', op: token.v, left, right: this.parseConcat() };
    }
    return left;
  }

  private parseConcat(): Expr {
    let left = this.parseAdditive();
    while (this.sym('||')) {
      this.next();
      left = { kind: 'binary', op: '||', left, right: this.parseAdditive() };
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.sym('+') || this.sym('-')) {
      const op = this.next().v;
      left = { kind: 'binary', op, left, right: this.parseMultiplicative() };
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (this.sym('*') || this.sym('/')) {
      const op = this.next().v;
      left = { kind: 'binary', op, left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.sym('-') || this.sym('+')) {
      const op = this.next().v;
      return { kind: 'unary', op, left: this.parseUnary() };
    }
    return this.parsePostfix(this.parsePrimary());
  }

  private parsePostfix(input: Expr): Expr {
    let expr = input;
    while (this.sym('::')) {
      this.next();
      const type = this.next();
      if (type.t !== 'word') throw new Error('Expected a type after ::');
      this.skipTypeParameters();
      expr = { kind: 'cast', castType: type.v.toUpperCase(), left: expr };
    }
    return expr;
  }

  private parsePrimary(): Expr {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end of Snowflake expression');
    if (t.t === 'number') {
      this.next();
      const value = Number(t.v);
      if (!Number.isFinite(value)) throw new Error(`Invalid numeric literal "${t.v}"`);
      return { kind: 'literal', value };
    }
    if (t.t === 'string') {
      this.next();
      return { kind: 'literal', value: t.v };
    }
    if (this.sym('*')) {
      this.next();
      return { kind: 'star' };
    }
    if (this.sym('(')) {
      this.next();
      if (this.is('SELECT')) {
        const select = this.parseSelect();
        this.expectSym(')');
        return { kind: 'select', select };
      }
      const expr = this.parseExpression();
      this.expectSym(')');
      return expr;
    }
    if (t.t === 'word') {
      const upper = t.v.toUpperCase();
      if (!t.quoted && upper === 'NULL') {
        this.next();
        return { kind: 'literal', value: null };
      }
      if (!t.quoted && (upper === 'TRUE' || upper === 'FALSE')) {
        this.next();
        return { kind: 'literal', value: upper === 'TRUE' };
      }
      if (!t.quoted && upper === 'CASE') return this.parseCase();
      if (!t.quoted && upper === 'CAST' && this.peek(1)?.v === '(') return this.parseCast();
      if (this.peek(1)?.t === 'sym' && this.peek(1)?.v === '(') return this.parseCall();

      this.next();
      let name = t.v;
      let orig = t.v;
      while (this.sym('.')) {
        this.next();
        const part = this.next();
        if (part.t !== 'word') throw new Error('Expected an identifier after "."');
        name = `${name}.${part.v}`;
        orig = `${orig}.${part.v}`;
      }
      return { kind: 'ident', name: lastIdent(name).toUpperCase(), orig: lastIdent(orig) };
    }
    this.next();
    throw new Error(`Unexpected token "${t.v}"`);
  }

  private parseCall(): Expr {
    const name = this.next().v.toUpperCase();
    this.expectSym('(');
    const distinct = this.is('DISTINCT');
    if (distinct) this.next();
    const args: Expr[] = [];
    if (!this.sym(')')) {
      for (;;) {
        args.push(this.parseExpression());
        if (this.sym(',')) {
          this.next();
          continue;
        }
        break;
      }
    }
    this.expectSym(')');
    let withinGroup: { expr: Expr; dir: 'ASC' | 'DESC' }[] | undefined;
    if (this.is('WITHIN')) {
      this.next();
      this.kw('GROUP');
      this.expectSym('(');
      this.kw('ORDER');
      this.kw('BY');
      withinGroup = [];
      for (;;) {
        const expr = this.parseExpression();
        let dir: 'ASC' | 'DESC' = 'ASC';
        if (this.is('ASC')) this.next();
        else if (this.is('DESC')) {
          this.next();
          dir = 'DESC';
        }
        withinGroup.push({ expr, dir });
        if (this.sym(',')) {
          this.next();
          continue;
        }
        break;
      }
      this.expectSym(')');
    }
    return { kind: 'call', name, args, distinct, withinGroup };
  }

  private parseCast(): Expr {
    this.kw('CAST');
    this.expectSym('(');
    const value = this.parseExpression();
    this.kw('AS');
    const type = this.next();
    if (type.t !== 'word') throw new Error('Expected a CAST target type');
    this.skipTypeParameters();
    this.expectSym(')');
    return { kind: 'cast', castType: type.v.toUpperCase(), left: value };
  }

  private skipTypeParameters(): void {
    if (!this.sym('(')) return;
    this.next();
    while (this.peek() && !this.sym(')')) this.next();
    this.expectSym(')');
  }

  private parseCase(): Expr {
    this.kw('CASE');
    const whens: { condition: Expr; result: Expr }[] = [];
    while (this.is('WHEN')) {
      this.next();
      const condition = this.parseExpression();
      this.kw('THEN');
      whens.push({ condition, result: this.parseExpression() });
    }
    if (whens.length === 0) throw new Error('Only searched CASE expressions are supported');
    let elseExpr: Expr | undefined;
    if (this.is('ELSE')) {
      this.next();
      elseExpr = this.parseExpression();
    }
    this.kw('END');
    return { kind: 'case', whens, elseExpr };
  }

  private qualifiedName(): string {
    const first = this.next();
    if (first.t !== 'word') throw new Error(`Expected a table name, got "${first.v}"`);
    const parts = [first.v];
    while (this.sym('.')) {
      this.next();
      const part = this.next();
      if (part.t !== 'word') throw new Error('Expected an identifier after "."');
      parts.push(part.v);
    }
    return parts.join('.');
  }
}

const AGGREGATES = new Set([
  'COUNT',
  'SUM',
  'MIN',
  'MAX',
  'AVG',
  'MEAN',
  'STDDEV',
  'STDDEV_SAMP',
  'LISTAGG',
  'ARRAY_AGG',
]);

function containsAggregate(expr: Expr | undefined): boolean {
  if (!expr || expr.kind === 'select') return false;
  if (expr.kind === 'call' && AGGREGATES.has(expr.name!)) return true;
  if (containsAggregate(expr.left) || containsAggregate(expr.right) || containsAggregate(expr.elseExpr)) return true;
  return (
    (expr.args ?? []).some(containsAggregate) ||
    (expr.whens ?? []).some((w) => containsAggregate(w.condition) || containsAggregate(w.result))
  );
}

export class MockQueryConnector implements QueryConnector {
  private readonly options: SnowflakeSourceOptions;
  private readonly database: string;
  private readonly currentSchema: string;
  private tables: Table[] = [];
  private seedTables: Table[] = [];
  private connected = false;

  constructor(options: SnowflakeSourceOptions) {
    this.options = options;
    this.database = (options.database ?? 'AVA').toUpperCase();
    this.currentSchema = (options.schema ?? DEFAULT_SCHEMA).toUpperCase();
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    this.seedTables = (this.options.tables ?? [])
      .filter((t) => t.columns.length > 0)
      .map((t) => {
        const nameParts = identParts(t.name);
        const tableSchema = (
          t.schema ?? (nameParts.length > 1 ? nameParts[nameParts.length - 2] : DEFAULT_SCHEMA)
        ).toUpperCase();
        const primaryKey =
          t.primaryKey === undefined ? undefined : Array.isArray(t.primaryKey) ? t.primaryKey : [t.primaryKey];
        return {
          name: lastIdent(t.name).toUpperCase(),
          schema: tableSchema,
          columns: t.columns.map((c) => ({
            name: c.name.toUpperCase(),
            type: c.type.toUpperCase(),
            notNull: Boolean(c.notNull),
          })),
          rows: (t.rows ?? []).map((row) =>
            Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toUpperCase(), v]))
          ),
          primaryKey: primaryKey?.map((column) => column.toUpperCase()),
        };
      });
    this.tables = [...this.seedTables, ...makeCatalog(this.database, this.seedTables)];
    this.connected = true;
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult & { rows: T[] }> {
    await this.connect();
    return this.run(sql) as QueryResult & { rows: T[] };
  }

  async close(): Promise<void> {
    this.connected = false;
    this.tables = [];
    this.seedTables = [];
  }

  private run(sql: string): QueryResult {
    const trimmed = sql.trim();
    if (/^show\b/i.test(trimmed)) return this.runShowPrimaryKeys(trimmed.replace(/;+\s*$/, ''));
    if (!/^select\b/i.test(trimmed)) {
      throw new Error('Mock Snowflake connector only executes read-only SELECT statements');
    }
    const { inner, limit } = unwrapWrapper(trimmed);
    const parsed = new Parser(tokenize(inner.replace(/;+\s*$/, ''))).parse();
    if (limit !== undefined) parsed.limit = parsed.limit === undefined ? limit : Math.min(limit, parsed.limit);
    return this.executeSelect(parsed);
  }

  private runShowPrimaryKeys(sql: string): QueryResult {
    const tokens = tokenize(sql);
    let pos = 0;
    const keyword = (expected: string): void => {
      const token = tokens[pos++];
      if (!token || token.t !== 'word' || token.quoted || token.v.toUpperCase() !== expected) {
        throw new Error('Mock Snowflake connector only supports SHOW PRIMARY KEYS IN SCHEMA');
      }
    };
    keyword('SHOW');
    keyword('PRIMARY');
    keyword('KEYS');
    keyword('IN');
    keyword('SCHEMA');

    const parts: string[] = [];
    const first = tokens[pos++];
    if (!first || first.t !== 'word') throw new Error('Expected a schema name after SHOW PRIMARY KEYS IN SCHEMA');
    parts.push(first.v);
    while (tokens[pos]?.t === 'sym' && tokens[pos]?.v === '.') {
      pos += 1;
      const part = tokens[pos++];
      if (!part || part.t !== 'word') throw new Error('Expected a qualified schema name');
      parts.push(part.v);
    }
    if (pos !== tokens.length || parts.length > 2) {
      throw new Error('Mock Snowflake connector only supports SHOW PRIMARY KEYS IN SCHEMA <database.schema>');
    }

    const schema = parts[parts.length - 1].toUpperCase();
    const database = parts.length === 2 ? parts[0].toUpperCase() : this.database;
    if (database !== this.database) return { columns: [], rows: [] };
    const rows = this.seedTables
      .filter((table) => table.schema === schema)
      .flatMap((table) =>
        (table.primaryKey ?? []).map((column, index) => ({
          database_name: this.database,
          schema_name: table.schema,
          table_name: table.name,
          column_name: column,
          key_sequence: index + 1,
        }))
      )
      .sort((a, b) => comparable(a.table_name, b.table_name) || comparable(a.key_sequence, b.key_sequence));
    return { columns: [], rows };
  }

  private resolve(from: string): Table {
    const parts = identParts(from);
    if (parts.length >= 2 && parts[parts.length - 2] === 'INFORMATION_SCHEMA') {
      if (parts.length === 3 && parts[0] !== this.database) throw new Error(`Invalid object name '${from}'`);
      const view = `INFORMATION_SCHEMA.${parts[parts.length - 1]}`;
      const table = this.tables.find((t) => t.name === view);
      if (!table) throw new Error(`Invalid object name '${view}'`);
      return table;
    }

    let database = this.database;
    let schema = this.currentSchema;
    let name: string;
    if (parts.length === 1) {
      name = parts[0];
    } else if (parts.length === 2) {
      schema = parts[0];
      name = parts[1];
    } else if (parts.length === 3) {
      database = parts[0];
      schema = parts[1];
      name = parts[2];
    } else {
      throw new Error(`Invalid object name '${from}'`);
    }
    if (database !== this.database) throw new Error(`Invalid object name '${from}'`);
    const table = this.seedTables.find((t) => t.name === name && t.schema === schema);
    if (!table) throw new Error(`Invalid object name '${from}'`);
    return table;
  }

  private rowsFor(parsed: ParsedSelect): Record<string, unknown>[] {
    const sourceRows = parsed.source
      ? this.executeSelect(parsed.source).rows
      : parsed.from
      ? this.resolve(parsed.from).rows
      : [{}];
    return parsed.where ? sourceRows.filter((row) => this.evaluate(parsed.where!, row) === true) : sourceRows;
  }

  private outputName(item: SelectItem): string {
    if (item.alias) return item.alias;
    if (item.expr.kind === 'ident') return item.expr.orig || item.expr.name!;
    if (item.expr.kind === 'call') return item.expr.name!;
    return 'VALUE';
  }

  private project(
    items: SelectItem[],
    row: Record<string, unknown>,
    group?: Record<string, unknown>[]
  ): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const item of items) {
      if (item.isStar) {
        for (const key of Object.keys(row)) out[key] = row[key];
      } else {
        out[this.outputName(item)] = this.evaluate(item.expr, row, group);
      }
    }
    return out;
  }

  private groupingExpression(expr: Expr, items: SelectItem[]): Expr {
    if (expr.kind === 'literal' && typeof expr.value === 'number' && Number.isSafeInteger(expr.value)) {
      return items[expr.value - 1]?.expr ?? expr;
    }
    if (expr.kind === 'ident') {
      const aliased = items.find((item) => item.alias && item.alias.toUpperCase() === expr.name);
      if (aliased) return aliased.expr;
    }
    return expr;
  }

  private executeSelect(parsed: ParsedSelect): QueryResult {
    const rows = this.rowsFor(parsed);
    const aggregateQuery =
      parsed.groupBy.length > 0 ||
      parsed.items.some((item) => containsAggregate(item.expr)) ||
      containsAggregate(parsed.having);

    let resultRows: Record<string, unknown>[];
    if (aggregateQuery) {
      const groups: Record<string, unknown>[][] = [];
      if (parsed.groupBy.length) {
        const byKey = new Map<string, Record<string, unknown>[]>();
        for (const row of rows) {
          const key = parsed.groupBy
            .map((expr) => valueKey(this.evaluate(this.groupingExpression(expr, parsed.items), row)))
            .join('|');
          const group = byKey.get(key) ?? [];
          if (group.length === 0) {
            byKey.set(key, group);
            groups.push(group);
          }
          group.push(row);
        }
      } else {
        // Global aggregates produce one row even when their input is empty.
        groups.push(rows);
      }

      resultRows = [];
      for (const group of groups) {
        const representative = group[0] ?? {};
        const out = this.project(parsed.items, representative, group);
        if (parsed.having) {
          const having = this.evaluate(parsed.having, { ...representative, ...out }, group);
          if (having !== true) continue;
        }
        resultRows.push(out);
      }
    } else {
      resultRows = rows.map((row) => this.project(parsed.items, row));
    }

    if (parsed.distinct) {
      const seen = new Set<string>();
      resultRows = resultRows.filter((row) => {
        const key = rowKey(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (parsed.orderBy.length) {
      const keyOf = (row: Record<string, unknown>, order: { expr: Expr }): unknown => {
        if (order.expr.kind === 'literal' && typeof order.expr.value === 'number') {
          return Object.values(row)[order.expr.value - 1];
        }
        if (order.expr.kind === 'ident') {
          const name = order.expr.name!;
          if (name in row) return row[name];
          const key = Object.keys(row).find((candidate) => candidate.toUpperCase() === name);
          return key === undefined ? undefined : row[key];
        }
        return this.evaluate(order.expr, row);
      };
      resultRows.sort((a, b) => {
        for (const order of parsed.orderBy) {
          const comparison = comparable(keyOf(a, order), keyOf(b, order));
          if (comparison !== 0) return order.dir === 'DESC' ? -comparison : comparison;
        }
        return 0;
      });
    }

    // A defined LIMIT of zero is meaningful and must not fall back to all rows.
    const limited = parsed.limit === undefined ? resultRows : resultRows.slice(0, parsed.limit);
    return { columns: [], rows: limited };
  }

  private lookup(row: Record<string, unknown>, name: string): unknown {
    if (name in row) return row[name];
    const key = Object.keys(row).find((candidate) => candidate.toUpperCase() === name.toUpperCase());
    return key === undefined ? undefined : row[key];
  }

  private cast(value: unknown, target: string): unknown {
    if (value == null) return null;
    if (/^(FLOAT|DOUBLE|REAL|NUMBER|DECIMAL|NUMERIC|INT|INTEGER|BIGINT|SMALLINT|TINYINT|BYTEINT)$/.test(target)) {
      const converted = Number(value);
      return Number.isNaN(converted) ? null : converted;
    }
    if (/^(VARCHAR|CHAR|STRING|TEXT)$/.test(target)) return String(value);
    if (target === 'BOOLEAN') return Boolean(value);
    return value;
  }

  private evaluate(expr: Expr, row: Record<string, unknown>, group?: Record<string, unknown>[]): unknown {
    switch (expr.kind) {
      case 'literal':
        return expr.value;
      case 'ident':
        return this.lookup(row, expr.name!);
      case 'select': {
        const result = this.executeSelect(expr.select!).rows[0];
        return result === undefined ? null : Object.values(result)[0] ?? null;
      }
      case 'cast':
        return this.cast(this.evaluate(expr.left!, row, group), expr.castType!);
      case 'case':
        for (const branch of expr.whens ?? []) {
          if (this.evaluate(branch.condition, row, group) === true) return this.evaluate(branch.result, row, group);
        }
        return expr.elseExpr ? this.evaluate(expr.elseExpr, row, group) : null;
      case 'unary': {
        const value = this.evaluate(expr.left!, row, group);
        if (expr.op === 'NOT') {
          if (value == null) return null;
          return !value;
        }
        if (value == null) return null;
        return expr.op === '-' ? -Number(value) : Number(value);
      }
      case 'binary':
        return this.evaluateBinary(expr, row, group);
      case 'call':
        if (AGGREGATES.has(expr.name!)) return this.applyAggregate(expr, group ?? [row]);
        return this.applyScalar(expr, row, group);
      case 'star':
        throw new Error('A star expression is only valid in SELECT * or COUNT(*)');
    }
  }

  private evaluateBinary(expr: Expr, row: Record<string, unknown>, group?: Record<string, unknown>[]): unknown {
    const op = expr.op!;
    if (op === 'AND' || op === 'OR') {
      const left = this.evaluate(expr.left!, row, group);
      if (op === 'AND' && left === false) return false;
      if (op === 'OR' && left === true) return true;
      const right = this.evaluate(expr.right!, row, group);
      if (op === 'AND') {
        if (right === false) return false;
        if (left == null || right == null) return null;
        return Boolean(left) && Boolean(right);
      }
      if (right === true) return true;
      if (left == null || right == null) return null;
      return Boolean(left) || Boolean(right);
    }

    const left = this.evaluate(expr.left!, row, group);
    if (op === 'IS NULL') return left == null;
    if (op === 'IS NOT NULL') return left != null;
    const right = this.evaluate(expr.right!, row, group);
    // Every ordinary comparison with NULL is UNKNOWN. In particular, NULL must
    // not behave as smaller than every value or as merely "not equal".
    if (left == null || right == null) return null;

    if (['=', '<>', '!=', '<', '>', '<=', '>='].includes(op)) {
      const comparison = comparable(left, right);
      switch (op) {
        case '=':
          return comparison === 0;
        case '<>':
        case '!=':
          return comparison !== 0;
        case '<':
          return comparison < 0;
        case '>':
          return comparison > 0;
        case '<=':
          return comparison <= 0;
        case '>=':
          return comparison >= 0;
      }
    }

    if (op === '||') return `${String(left)}${String(right)}`;
    if (op === '+') return Number(left) + Number(right);
    if (op === '-') return Number(left) - Number(right);
    if (op === '*') return Number(left) * Number(right);
    if (op === '/') return Number(right) === 0 ? null : Number(left) / Number(right);
    throw new Error(`Unsupported operator in Snowflake mock: ${op}`);
  }

  private applyAggregate(expr: Expr, group: Record<string, unknown>[]): unknown {
    const name = expr.name!;
    const arg = expr.args?.[0];
    if (name === 'COUNT') {
      if (!arg || arg.kind === 'star') return group.length;
      let values = group.map((row) => this.evaluate(arg, row)).filter((value) => value != null);
      if (expr.distinct) {
        const seen = new Set<string>();
        values = values.filter((value) => {
          const key = valueKey(value);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      return values.length;
    }

    if (name === 'ARRAY_AGG') {
      const ordered = [...group];
      if (expr.withinGroup?.length) {
        ordered.sort((a, b) => {
          for (const order of expr.withinGroup!) {
            const comparison = comparable(this.evaluate(order.expr, a), this.evaluate(order.expr, b));
            if (comparison !== 0) return order.dir === 'DESC' ? -comparison : comparison;
          }
          return 0;
        });
      }
      return ordered.map((row) => (arg ? this.evaluate(arg, row) : null));
    }

    if (name === 'LISTAGG') {
      const delimiter = expr.args?.[1] ? String(this.evaluate(expr.args[1], group[0] ?? {})) : ',';
      return group
        .map((row) => (arg ? this.evaluate(arg, row) : null))
        .filter((value) => value != null)
        .map(String)
        .join(delimiter);
    }

    const values = group
      .map((row) => (arg ? this.evaluate(arg, row) : null))
      .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
    if (name === 'SUM') return values.length ? values.reduce<number>((sum, value) => sum + value, 0) : null;
    if (values.length === 0) return null;
    if (name === 'MIN') return Math.min(...values);
    if (name === 'MAX') return Math.max(...values);
    if (name === 'AVG' || name === 'MEAN') return values.reduce<number>((sum, value) => sum + value, 0) / values.length;
    if (name === 'STDDEV' || name === 'STDDEV_SAMP') {
      if (values.length < 2) return null;
      const mean = values.reduce<number>((sum, value) => sum + value, 0) / values.length;
      const variance = values.reduce<number>((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
      return Math.sqrt(variance);
    }
    throw new Error(`Unsupported aggregate in Snowflake mock: ${name}`);
  }

  private applyScalar(expr: Expr, row: Record<string, unknown>, group?: Record<string, unknown>[]): unknown {
    const args = (expr.args ?? []).map((arg) => this.evaluate(arg, row, group));
    if (expr.name === 'TO_JSON') return JSON.stringify(args[0]);
    if (expr.name === 'OBJECT_CONSTRUCT') {
      if (args.length % 2 !== 0) throw new Error('OBJECT_CONSTRUCT requires key/value pairs');
      const result: Record<string, unknown> = {};
      for (let i = 0; i < args.length; i += 2) result[String(args[i])] = args[i + 1];
      return result;
    }
    if (expr.name === 'LENGTH') return args[0] == null ? null : String(args[0]).length;
    if (expr.name === 'REPLACE') {
      if (args.slice(0, 3).some((value) => value == null)) return null;
      return String(args[0])
        .split(String(args[1]))
        .join(String(args[2] ?? ''));
    }
    if (expr.name === 'DATEDIFF') {
      const partExpr = expr.args?.[0];
      const part = partExpr?.kind === 'ident' ? partExpr.name!.toLowerCase() : String(args[0]).toLowerCase();
      if (part !== 'millisecond' && part !== 'milliseconds' && part !== 'ms') {
        throw new Error(`Unsupported DATEDIFF part in Snowflake mock: ${part}`);
      }
      const start = this.dateMs(args[1]);
      const end = this.dateMs(args[2]);
      return start == null || end == null ? null : end - start;
    }
    throw new Error(`Unsupported function in Snowflake mock: ${expr.name}`);
  }

  private dateMs(value: unknown): number | null {
    if (value == null) return null;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return value;
    const text = String(value);
    const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(text)
      ? `${text.replace(' ', 'T')}Z`
      : text;
    const result = Date.parse(normalized);
    return Number.isNaN(result) ? null : result;
  }
}

// Re-export helpers used by the engine and tests.
export { DEFAULT_SCHEMA, sqlIdentifier, sqlStringLiteral };
export type { Table, Column };
