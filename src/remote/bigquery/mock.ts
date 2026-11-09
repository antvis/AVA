/**
 * Built-in in-memory BigQuery connector. It seeds dataset-scoped
 * INFORMATION_SCHEMA views from the configured `tables` and runs a small
 * read-only GoogleSQL subset (SELECT with WHERE/GROUP BY/aggregates/ORDER BY,
 * aliased and dotted identifiers, LIMIT) so the engine, CLI and demos run
 * end-to-end without a live GCP project. It mirrors the contract the
 * `@google-cloud/bigquery` adapter fulfills in production and enforces
 * read-only by rejecting any statement that is not a SELECT.
 *
 * The subset is intentionally small — it exists to exercise the engine's
 * schema-discovery queries and simple data queries, not to be a SQL engine.
 */
import { resolveMetric } from '../../util/profile';
import { sqlIdentifier, sqlStringLiteral } from '../../util/sql';

import { BUILTIN_METRICS, logicalType } from './profile';

import type { BigQuerySourceOptions, JsonValue, ParsedProfileOptions, Profile, Schema } from '../../types';
import type { MetricField } from '../../util/profile';
import type { QueryConnector, QueryResult, QueryResultRow } from './connector';

const DEFAULT_DATASET = 'demo';

interface Column {
  name: string;
  type: string;
  notNull: boolean;
}

interface Table {
  dataset: string;
  name: string;
  columns: Column[];
  rows: Record<string, unknown>[];
  primaryKey?: string[];
}

/** Normalize an identifier path: strip backticks/quotes, take the last segment, lower-case. */
function lastIdent(qualified: string): string {
  const cleaned = qualified.replace(/`/g, '').replace(/"/g, '');
  const segments = cleaned.split('.').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

function comparable(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const av = String(a);
  const bv = String(b);
  return av === bv ? 0 : av < bv ? -1 : 1;
}

/** Build dataset-scoped INFORMATION_SCHEMA catalog tables seeded from a concrete table list. */
function makeCatalog(dataset: string, tables: Table[], project = dataset): Table[] {
  const tabs: Record<string, unknown>[] = tables.map((t) => ({
    table_catalog: project,
    table_schema: dataset,
    table_name: t.name,
    table_type: 'BASE TABLE',
  }));
  const cols: Record<string, unknown>[] = tables.flatMap((t) =>
    t.columns.map((c, i) => ({
      table_catalog: project,
      table_schema: dataset,
      table_name: t.name,
      column_name: c.name,
      ordinal_position: i + 1,
      is_nullable: c.notNull ? 'NO' : 'YES',
      data_type: c.type,
    }))
  );
  const keyUsage: Record<string, unknown>[] = tables.flatMap((t) => {
    const primaryKey = t.primaryKey ?? t.columns.filter((c) => c.notNull && c.name === 'id').map((c) => c.name);
    return primaryKey
      .map((name) => t.columns.find((c) => c.name === name))
      .filter((c): c is Column => c !== undefined)
      .map((c, i) => ({
        table_catalog: project,
        table_schema: dataset,
        table_name: t.name,
        column_name: c.name,
        constraint_catalog: project,
        constraint_schema: dataset,
        constraint_name: `PK_${t.name}`,
        ordinal_position: i + 1,
      }));
  });
  const tableConstraints = tables
    .filter((t) => keyUsage.some((key) => key.table_name === t.name))
    .map((t) => ({
      table_catalog: project,
      table_schema: dataset,
      table_name: t.name,
      constraint_catalog: project,
      constraint_schema: dataset,
      constraint_name: `PK_${t.name}`,
      constraint_type: 'PRIMARY KEY',
    }));

  return [
    {
      dataset,
      name: 'INFORMATION_SCHEMA.TABLES',
      columns: [
        { name: 'table_catalog', type: 'STRING', notNull: true },
        { name: 'table_schema', type: 'STRING', notNull: true },
        { name: 'table_name', type: 'STRING', notNull: true },
        { name: 'table_type', type: 'STRING', notNull: true },
      ],
      rows: tabs,
    },
    {
      dataset,
      name: 'INFORMATION_SCHEMA.COLUMNS',
      columns: [
        { name: 'table_catalog', type: 'STRING', notNull: true },
        { name: 'table_schema', type: 'STRING', notNull: true },
        { name: 'table_name', type: 'STRING', notNull: true },
        { name: 'column_name', type: 'STRING', notNull: true },
        { name: 'ordinal_position', type: 'INT64', notNull: true },
        { name: 'is_nullable', type: 'STRING', notNull: true },
        { name: 'data_type', type: 'STRING', notNull: true },
      ],
      rows: cols,
    },
    {
      dataset,
      name: 'INFORMATION_SCHEMA.KEY_COLUMN_USAGE',
      columns: [
        { name: 'table_catalog', type: 'STRING', notNull: true },
        { name: 'table_schema', type: 'STRING', notNull: true },
        { name: 'table_name', type: 'STRING', notNull: true },
        { name: 'column_name', type: 'STRING', notNull: true },
        { name: 'constraint_catalog', type: 'STRING', notNull: true },
        { name: 'constraint_schema', type: 'STRING', notNull: true },
        { name: 'constraint_name', type: 'STRING', notNull: true },
        { name: 'ordinal_position', type: 'INT64', notNull: true },
      ],
      rows: keyUsage,
    },
    {
      dataset,
      name: 'INFORMATION_SCHEMA.TABLE_CONSTRAINTS',
      columns: [
        { name: 'table_catalog', type: 'STRING', notNull: true },
        { name: 'table_schema', type: 'STRING', notNull: true },
        { name: 'table_name', type: 'STRING', notNull: true },
        { name: 'constraint_catalog', type: 'STRING', notNull: true },
        { name: 'constraint_schema', type: 'STRING', notNull: true },
        { name: 'constraint_name', type: 'STRING', notNull: true },
        { name: 'constraint_type', type: 'STRING', notNull: true },
      ],
      rows: tableConstraints,
    },
  ];
}

// ── tiny tokenizer / parser for the supported GoogleSQL subset ─────────────
type Token = { t: 'word' | 'string' | 'number' | 'sym'; v: string };

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
    if (ch === "'" || ch === '"') {
      const quote = ch;
      let value = '';
      let closed = false;
      i += 1;
      while (i < n) {
        if (sql[i] === '\\') {
          if (i + 1 >= n) break;
          value += sql[i + 1];
          i += 2;
          continue;
        }
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            value += quote;
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
      if (!closed) throw new Error('Unterminated quoted string in BigQuery statement');
      tokens.push({ t: 'string', v: value });
      continue;
    }
    if (ch === '`') {
      let value = '';
      i += 1;
      for (; i < n; i++) {
        if (sql[i] === '`') {
          if (sql[i + 1] === '`') {
            value += '`';
            i += 1;
            continue;
          }
          i += 1;
          break;
        }
        value += sql[i];
      }
      tokens.push({ t: 'word', v: value });
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9.]/.test(sql[j])) j += 1;
      tokens.push({ t: 'number', v: sql.slice(i, j) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let value = '';
      while (i < n && /[a-zA-Z0-9_$#@]/.test(sql[i])) {
        value += sql[i];
        i += 1;
      }
      tokens.push({ t: 'word', v: value });
      continue;
    }
    const pair = sql.slice(i, i + 2);
    if (pair === '<=' || pair === '>=' || pair === '<>' || pair === '!=') {
      tokens.push({ t: 'sym', v: pair });
      i += 2;
      continue;
    }
    if (pair === '/*') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
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

interface SelectItem {
  expr: Expr;
  alias: string;
  isStar: boolean;
}

interface Expr {
  kind: 'ident' | 'literal' | 'call' | 'star';
  value?: unknown;
  name?: string;
  /** Original (as-written) spelling of the last identifier segment, for preserving output case. */
  orig?: string;
  args?: Expr[];
}

interface Predicate {
  expr: Expr;
  op: string;
  value: unknown;
  /** Connector marker; null identifies a comparison. */
  and: boolean | null;
}

interface ParsedSelect {
  items: SelectItem[];
  from?: string;
  predicates: Predicate[];
  having: Predicate[];
  groupBy: string[];
  orderBy: { name: string; dir: 'ASC' | 'DESC' }[];
  limit?: number;
}

/** Unwrap the engine's `SELECT * FROM ( <inner> ) AS __ava_query LIMIT N` wrapper. */
function unwrapWrapper(sql: string): { inner: string; limit?: number } {
  const m = sql.match(
    /^\s*SELECT\s+\*\s+FROM\s*\(\s*([\s\S]+?)\s*\)\s+AS\s+\w+\s*LIMIT\s+(\d+)\s*$/i
  );
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
    if (!t) throw new Error('Unexpected end of BigQuery statement');
    this.pos += 1;
    return t;
  }
  private is(w: string): boolean {
    const t = this.peek();
    return t?.t === 'word' && t.v.toUpperCase() === w.toUpperCase();
  }
  private kw(w: string): void {
    const t = this.next();
    if (t.t !== 'word' || t.v.toUpperCase() !== w.toUpperCase()) {
      throw new Error(`Expected "${w}"`);
    }
  }

  parse(): ParsedSelect {
    this.kw('SELECT');
    const items: SelectItem[] = [];
    for (;;) {
      items.push(this.parseItem());
      if (this.peek()?.t === 'sym' && this.peek()?.v === ',') {
        this.next();
        continue;
      }
      break;
    }

    let from: string | undefined;
    if (this.is('FROM')) {
      this.next();
      if (this.peek()?.t === 'sym' && this.peek()?.v === '(') {
        throw new Error('Subqueries in FROM are not supported by the mock connector');
      }
      let table = this.next().v;
      // Consume the full dotted path: dataset.INFORMATION_SCHEMA.TABLES etc.
      while (this.peek()?.t === 'sym' && this.peek()?.v === '.') {
        this.next();
        table = `${table}.${this.next().v}`;
      }
      from = table;
      // optional table alias (skip a single following word that is not a keyword)
      if (this.peek()?.t === 'word' && !this.isKeyword(this.peek()!.v)) {
        this.next();
      }
    }

    const predicates: Predicate[] = this.is('WHERE') ? this.parseWhere() : [];

    const groupBy: string[] = [];
    if (this.is('GROUP')) {
      this.kw('GROUP');
      this.kw('BY');
      for (;;) {
        groupBy.push(this.qualified());
        if (this.peek()?.t === 'sym' && this.peek()?.v === ',') {
          this.next();
          continue;
        }
        break;
      }
    }

    const having: Predicate[] = this.is('HAVING') ? this.parsePredicates('HAVING', true) : [];

    const orderBy: { name: string; dir: 'ASC' | 'DESC' }[] = [];
    if (this.is('ORDER')) {
      this.kw('ORDER');
      this.kw('BY');
      for (;;) {
        const name = this.qualified();
        let dir: 'ASC' | 'DESC' = 'ASC';
        if (this.is('ASC')) this.next();
        else if (this.is('DESC')) {
          this.next();
          dir = 'DESC';
        }
        orderBy.push({ name, dir });
        if (this.peek()?.t === 'sym' && this.peek()?.v === ',') {
          this.next();
          continue;
        }
        break;
      }
    }

    let limit: number | undefined;
    if (this.is('LIMIT')) {
      this.next();
      limit = Number(this.next().v);
    }

    if (this.peek()) throw new Error(`Unsupported BigQuery syntax near "${this.peek()?.v}"`);

    return { items, from, predicates, having, groupBy, orderBy, limit };
  }

  private isKeyword(word: string): boolean {
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
      'LEFT',
      'RIGHT',
      'INNER',
      'OUTER',
      'CROSS',
      'JOIN',
      'ON',
      'CASE',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
    ].includes(word.toUpperCase());
  }

  private parseItem(): SelectItem {
    const t = this.peek()!;
    if (t.t === 'sym' && t.v === '*') {
      this.next();
      return { expr: { kind: 'star' }, alias: '*', isStar: true };
    }
    const expr = this.parseExpr();
    let alias = '';
    if (this.is('AS')) {
      this.next();
      alias = this.next().v;
    } else if (this.peek()?.t === 'word' && !this.isKeyword(this.peek()!.v)) {
      alias = this.next().v;
    }
    return { expr, alias, isStar: false };
  }

  private parseExpr(): Expr {
    const t = this.peek()!;
    if (t.t === 'number') {
      this.next();
      return { kind: 'literal', value: Number(t.v) };
    }
    if (t.t === 'string') {
      this.next();
      return { kind: 'literal', value: t.v };
    }
    if (t.t === 'sym' && t.v === '*') {
      this.next();
      return { kind: 'star' };
    }
    if (t.t === 'word') {
      const upper = t.v.toUpperCase();
      if (upper === 'NULL') {
        this.next();
        return { kind: 'literal', value: null };
      }
      if (upper === 'TRUE' || upper === 'FALSE') {
        this.next();
        return { kind: 'literal', value: upper === 'TRUE' };
      }
      if (this.peek(1)?.t === 'sym' && this.peek(1)?.v === '(') {
        this.next();
        this.next(); // (
        const args: Expr[] = [];
        if (!(this.peek()?.t === 'sym' && this.peek()?.v === ')')) {
          for (;;) {
            args.push(this.parseExpr());
            if (this.peek()?.t === 'sym' && this.peek()?.v === ',') {
              this.next();
              continue;
            }
            break;
          }
          this.next(); // )
        } else {
          this.next();
        }
        return { kind: 'call', name: t.v.toUpperCase(), args };
      }
      // identifier path, possibly dotted or backquoted
      this.next();
      let name = t.v;
      let orig = t.v;
      while (this.peek()?.t === 'sym' && this.peek()?.v === '.') {
        this.next();
        const part = this.next().v;
        name = `${name}.${part}`;
        orig = `${orig}.${part}`;
      }
      return { kind: 'ident', name: lastIdent(name).toLowerCase(), orig: lastIdent(orig) };
    }
    this.next();
    throw new Error(`Unexpected token "${t.v}"`);
  }

  /** Consume a possibly dotted identifier path (alias.col or a.b.c) and return its final segment lower-cased. */
  private qualified(): string {
    let name = this.next().v;
    while (this.peek()?.t === 'sym' && this.peek()?.v === '.') {
      this.next();
      name = `${name}.${this.next().v}`;
    }
    return lastIdent(name).toLowerCase();
  }

  private parseWhere(): Predicate[] {
    return this.parsePredicates('WHERE', false);
  }

  private parsePredicates(keyword: string, allowAggregate: boolean): Predicate[] {
    this.kw(keyword);
    const predicates: Predicate[] = [];
    for (;;) {
      const expr = this.parseExpr();
      if (expr.kind !== 'ident' && !(allowAggregate && expr.kind === 'call')) {
        throw new Error(`Unsupported expression in ${keyword} clause`);
      }
      const op = this.next();
      let opStr = op.v;
      if (this.peek()?.t === 'sym' && (this.peek()!.v === '=' || this.peek()!.v === '>')) {
        opStr = `${op.v}${this.next().v}`;
      }
      const valueToken = this.next();
      let value: unknown;
      if (valueToken.t === 'string') value = valueToken.v;
      else if (valueToken.t === 'number') value = Number(valueToken.v);
      else if (valueToken.t === 'word' && valueToken.v.toUpperCase() === 'NULL') value = null;
      else throw new Error(`Unsupported value in ${keyword} clause`);
      predicates.push({ expr, op: opStr, value, and: null });

      if (this.is('AND') || this.is('OR')) {
        const and = this.is('AND');
        this.next();
        predicates.push({ expr: { kind: 'literal', value: null }, op: '', value: null, and });
        continue;
      }
      break;
    }
    return predicates;
  }
}

function matches(
  predicates: Predicate[],
  row: Record<string, unknown>,
  group?: Record<string, unknown>[]
): boolean {
  if (predicates.length === 0) return true;
  // Each inner array is an AND group; OR only starts a new group. This gives
  // AND higher precedence without changing the deliberately small parser.
  const orGroups: boolean[][] = [[]];
  for (const p of predicates) {
    if (p.and !== null) {
      if (!p.and) orGroups.push([]);
      continue;
    }
    let left: unknown;
    if (p.expr.kind === 'ident') left = row[p.expr.name!];
    else if (p.expr.kind === 'call' && group) {
      left = applyAggregate(p.expr.name!, p.expr.args ?? [], group);
    } else {
      throw new Error('Aggregate predicates require an aggregate group');
    }

    // SQL comparisons with NULL evaluate to UNKNOWN, which does not pass a
    // WHERE/HAVING filter (including !=, <= and >=).
    let current = false;
    if (left != null && p.value != null) {
      const c = comparable(left, p.value);
      switch (p.op) {
        case '=':
          current = c === 0;
          break;
        case '<>':
        case '!=':
          current = c !== 0;
          break;
        case '<':
          current = c < 0;
          break;
        case '>':
          current = c > 0;
          break;
        case '<=':
          current = c <= 0;
          break;
        case '>=':
          current = c >= 0;
          break;
        default:
          throw new Error(`Unsupported comparison operator: ${p.op}`);
      }
    }
    orGroups[orGroups.length - 1].push(current);
  }
  return orGroups.some((andGroup) => andGroup.every(Boolean));
}

function applyAggregate(name: string, args: Expr[], group: Record<string, unknown>[]): unknown {
  const upper = name.toUpperCase();
  if (upper === 'COUNT') {
    const arg = args[0];
    const col = arg?.kind === 'ident' ? arg.name! : undefined;
    return col ? group.filter((r) => r[col] != null).length : group.length;
  }
  const col = args[0]?.kind === 'ident' ? args[0]!.name! : '';
  const values = group.map((r) => r[col]).filter((v) => typeof v === 'number');
  if (upper === 'SUM') return values.length ? values.reduce<number>((s, v) => s + v, 0) : null;
  if (upper === 'AVG' || upper === 'MEAN') return values.length ? values.reduce<number>((s, v) => s + v, 0) / values.length : null;
  if (values.length === 0) return null;
  if (upper === 'MIN') return Math.min(...values);
  if (upper === 'MAX') return Math.max(...values);
  if (upper === 'STDDEV_SAMP' || upper === 'STDDEV') {
    if (values.length < 2) return null;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }
  return null;
}

function distinctValues(values: unknown[]): unknown[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = `${typeof value}:${JSON.stringify(value)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function temporalMs(value: unknown, type: string): number | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  const text = String(value);
  if (type.toLowerCase() === 'time') {
    const match = text.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/);
    if (!match) return null;
    const milliseconds = Number(`${match[4] ?? ''}000`.slice(0, 3));
    return Number(match[1]) * 3600000 + Number(match[2]) * 60000 + Number(match[3]) * 1000 + milliseconds;
  }
  const normalized = type.toLowerCase() === 'datetime' ? `${text.replace(' ', 'T')}Z` : text;
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function mockMetricValue(
  id: string,
  metric: ParsedProfileOptions['metrics'][number],
  rows: Record<string, unknown>[],
  field?: MetricField
): JsonValue {
  if (id === 'row_count') return rows.length;
  if (!field) throw new Error(`Metric ${id} requires a column`);
  const values = rows.map((row) => row[field.name.toLowerCase()]);
  const present = values.filter((value) => value != null);
  const distinct = distinctValues(present);
  const numbers = present.map(Number).filter(Number.isFinite);

  switch (id) {
    case 'null_count':
      return values.length - present.length;
    case 'distinct_count':
      return distinct.length;
    case 'duplicate_count':
      return present.length - distinct.length;
    case 'top_values': {
      const limit = metric.limit === undefined ? 3 : Number(metric.limit);
      const maxDistinctRatio = metric.maxDistinctRatio === undefined ? 0.5 : Number(metric.maxDistinctRatio);
      if (distinct.length > rows.length * maxDistinctRatio) return null;
      const counts = new Map<string, { value: string; count: number }>();
      for (const value of present) {
        const stringValue = String(value);
        const entry = counts.get(stringValue) ?? { value: stringValue, count: 0 };
        entry.count += 1;
        counts.set(stringValue, entry);
      }
      return [...counts.values()]
        .sort((a, b) => b.count - a.count || comparable(a.value, b.value))
        .slice(0, limit);
    }
    case 'min':
    case 'max': {
      const candidates =
        field.logicalType === 'date'
          ? present.map((value) => temporalMs(value, field.type)).filter((value): value is number => value != null)
          : numbers;
      if (!candidates.length) return null;
      return id === 'min' ? Math.min(...candidates) : Math.max(...candidates);
    }
    case 'min_length':
    case 'max_length': {
      const lengths = present.map((value) => Array.from(String(value)).length);
      if (!lengths.length) return null;
      return id === 'min_length' ? Math.min(...lengths) : Math.max(...lengths);
    }
    case 'mean':
      return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null;
    case 'sum':
      return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) : null;
    case 'stddev': {
      if (numbers.length < 2) return null;
      const mean = numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
      const variance = numbers.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (numbers.length - 1);
      return Math.sqrt(variance);
    }
    default:
      throw new Error(`Unsupported mock profile metric: ${id}`);
  }
}

/** Evaluate profiling directly over seed rows instead of unsupported profiling SQL. */
function profileMockTables(tables: Table[], schema: Schema, options: ParsedProfileOptions): Profile {
  const metrics = options.metrics.map((metric) => ({
    metric,
    definition: resolveMetric(metric, BUILTIN_METRICS),
  }));

  return {
    models: schema.models.map((source) => {
      const name = lastIdent(source.name).toLowerCase();
      const table = tables.find((candidate) => candidate.name === name && !candidate.name.startsWith('INFORMATION_SCHEMA.'));
      if (!table) throw new Error(`Table ${source.name} not found in mock seed`);
      const model: Profile['models'][number] = { name: source.name, metrics: {}, columns: [] };
      const add = (output: Record<string, JsonValue>, field?: MetricField) => {
        for (const { metric, definition } of metrics) {
          if (!definition.enable({ target: field ? 'column' : 'table', field })) continue;
          const value = mockMetricValue(metric.id, metric, table.rows, field);
          delete output[metric.id];
          // A null top_values CASE means the metric was skipped; other SQL NULL
          // metrics remain explicit null observations.
          if (metric.id !== 'top_values' || value != null) output[metric.id] = value;
        }
      };

      add(model.metrics);
      model.columns = source.columns.map((column) => {
        const field: MetricField = { ...column, logicalType: logicalType(column.type) };
        const output: Record<string, JsonValue> = {};
        add(output, field);
        return { name: field.name, properties: { logicalType: field.logicalType }, metrics: output };
      });
      return model;
    }),
  };
}

export class MockQueryConnector implements QueryConnector {
  private readonly options: BigQuerySourceOptions;
  private tables: Table[] = [];
  private connected = false;
  private datasetName: string;

  constructor(options: BigQuerySourceOptions) {
    this.options = options;
    this.datasetName = options.dataset ?? DEFAULT_DATASET;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    const dataset = this.datasetName;
    const seeded: Table[] = (this.options.tables ?? [])
      .filter((t) => t.columns.length > 0)
      .map((t) => ({
        dataset,
        name: lastIdent(t.name).toLowerCase(),
        columns: t.columns.map((c) => ({ name: c.name.toLowerCase(), type: c.type, notNull: Boolean(c.notNull) })),
        rows: (t.rows ?? []).map((row) =>
          Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]))
        ),
        primaryKey: t.primaryKey
          ? (Array.isArray(t.primaryKey) ? t.primaryKey : [t.primaryKey]).map((name) => name.toLowerCase())
          : undefined,
      }));
    this.tables = [...seeded, ...makeCatalog(dataset, seeded, this.options.projectId)];
    this.connected = true;
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult & { rows: T[] }> {
    await this.connect();
    return this.run(sql) as QueryResult & { rows: T[] };
  }

  async profile(schema: Schema, options: ParsedProfileOptions): Promise<Profile> {
    await this.connect();
    return profileMockTables(this.tables, schema, options);
  }

  async close(): Promise<void> {
    this.connected = false;
    this.tables = [];
  }

  private run(sql: string): QueryResult {
    const trimmed = sql.trim();
    if (!/^select\b/i.test(trimmed)) {
      throw new Error('Mock BigQuery connector only executes read-only SELECT statements');
    }
    const { inner, limit } = unwrapWrapper(trimmed.replace(/;+\s*$/, ''));
    const parsed = new Parser(tokenize(inner.replace(/;+\s*$/, ''))).parse();
    if (parsed.limit !== undefined && limit === undefined) {
      // The parser understands a LIMIT that the engine wrapper did not capture;
      // only enforce the wrapper's explicit bound when present to match BigQuery.
    }
    const result = this.executeSelect(parsed);
    const effective = Math.min(limit ?? result.rows.length, parsed.limit ?? result.rows.length);
    return { columns: result.columns, rows: result.rows.slice(0, effective) };
  }

  private resolve(from: string): Table {
    const upper = from.toUpperCase();
    // dataset.INFORMATION_SCHEMA.X is registered under its short name.
    if (/INFORMATION_SCHEMA\./i.test(upper)) {
      const view = from.replace(/^.*INFORMATION_SCHEMA\./i, 'INFORMATION_SCHEMA.');
      const table = this.tables.find((t) => t.name.toUpperCase() === view.toUpperCase());
      if (!table) throw new Error(`Table ${view} not found in dataset '${this.datasetName}'`);
      return table;
    }
    const name = lastIdent(from);
    const table = this.tables.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (!table) throw new Error(`Table ${from} not found in dataset '${this.datasetName}'`);
    return table;
  }

  private executeSelect(parsed: ParsedSelect): QueryResult {
    const source = parsed.from ? this.resolve(parsed.from) : undefined;
    const sourceRows = source?.rows ?? [{}];
    const rows = parsed.predicates.length ? sourceRows.filter((r) => matches(parsed.predicates, r)) : sourceRows;

    let resultRows: Record<string, unknown>[];
    if (parsed.groupBy.length) {
      const groups = new Map<string, Record<string, unknown>[]>();
      for (const row of rows) {
        const key = parsed.groupBy.map((g) => `${String(row[g])}\u0000`).join('|');
        const arr = groups.get(key) ?? [];
        arr.push(row);
        groups.set(key, arr);
      }
      resultRows = [...groups.values()]
        .filter((group) => matches(parsed.having, group[0], group))
        .map((group) => {
          const out: Record<string, unknown> = {};
        for (const item of parsed.items) {
          if (item.isStar) continue;
          if (item.expr.kind === 'call') {
            out[item.alias || (item.expr.name?.toLowerCase() ?? '')] = applyAggregate(item.expr.name!, item.expr.args ?? [], group);
          } else if (item.expr.kind === 'literal') {
            out[item.alias || 'value'] = item.expr.value;
          } else if (item.expr.kind === 'ident') {
            out[item.alias || item.expr.orig || item.expr.name!] = group[0][item.expr.name!];
          }
        }
        return out;
      });
    } else {
      const usesAggregate = parsed.items.some((item) => item.expr.kind === 'call');
      if (usesAggregate) {
        resultRows = [
          (() => {
            const out: Record<string, unknown> = {};
            for (const item of parsed.items) {
              if (item.isStar) continue;
              if (item.expr.kind === 'call') {
                out[item.alias || (item.expr.name?.toLowerCase() ?? '')] = applyAggregate(item.expr.name!, item.expr.args ?? [], rows);
              } else if (item.expr.kind === 'literal') {
                out[item.alias || 'value'] = item.expr.value;
              } else if (item.expr.kind === 'ident') {
                out[item.alias || item.expr.orig || item.expr.name!] = rows[0]?.[item.expr.name!];
              }
            }
            return out;
          })(),
        ];
        resultRows = resultRows.filter(
          (r) => Object.keys(r).length > 0 && matches(parsed.having, rows[0] ?? {}, rows)
        );
      } else {
        if (parsed.having.length) throw new Error('HAVING requires GROUP BY or an aggregate query');
        resultRows = rows.map((row) => {
          const out: Record<string, unknown> = {};
          for (const item of parsed.items) {
            if (item.isStar) {
              for (const k of Object.keys(row)) out[k] = row[k];
              continue;
            }
            if (item.expr.kind === 'ident') {
              out[item.alias || item.expr.orig || item.expr.name!] = row[item.expr.name!];
            } else if (item.expr.kind === 'call') {
              out[item.alias || (item.expr.name?.toLowerCase() ?? '')] = applyAggregate(item.expr.name!, item.expr.args ?? [], [row]);
            } else if (item.expr.kind === 'literal') {
              out[item.alias || 'value'] = item.expr.value;
            }
          }
          return out;
        });
      }
    }

    if (parsed.orderBy.length) {
      const keyOf = (row: Record<string, unknown>, name: string): unknown => {
        const lower = name.toLowerCase();
        if (name in row) return row[name];
        if (lower in row) return row[lower];
        const k = Object.keys(row).find((rk) => rk.toLowerCase() === name.toLowerCase());
        return k === undefined ? undefined : row[k];
      };
      resultRows.sort((a, b) => {
        for (const o of parsed.orderBy) {
          const c = comparable(keyOf(a, o.name), keyOf(b, o.name));
          if (c !== 0) return o.dir === 'DESC' ? -c : c;
        }
        return 0;
      });
    }

    const n = parsed.limit !== undefined ? Math.min(parsed.limit, resultRows.length) : resultRows.length;
    return { columns: [], rows: resultRows.slice(0, n) };
  }
}

export { DEFAULT_DATASET, sqlIdentifier, sqlStringLiteral };
export type { Table, Column };