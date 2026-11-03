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
import { sqlIdentifier, sqlStringLiteral } from '../../util/sql';

import type { BigQuerySourceOptions } from '../../types';
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
  primaryKey?: string;
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
function makeCatalog(dataset: string, tables: Table[]): Table[] {
  const tabs: Record<string, unknown>[] = tables.map((t) => ({
    table_catalog: dataset,
    table_schema: dataset,
    table_name: t.name,
    table_type: 'BASE TABLE',
  }));
  const cols: Record<string, unknown>[] = tables.flatMap((t) =>
    t.columns.map((c, i) => ({
      table_catalog: dataset,
      table_schema: dataset,
      table_name: t.name,
      column_name: c.name,
      ordinal_position: i + 1,
      is_nullable: c.notNull ? 'NO' : 'YES',
      data_type: c.type,
    }))
  );
  const keyUsage: Record<string, unknown>[] = tables.flatMap((t) => {
    const v = t.primaryKey
      ? t.columns.filter((c) => c.name === t.primaryKey)
      : t.columns.filter((c) => c.notNull && c.name === 'id');
    return v
      .slice(0, 1)
      .map((c, i) => ({
        table_catalog: dataset,
        table_schema: dataset,
        table_name: t.name,
        column_name: c.name,
        constraint_catalog: dataset,
        constraint_schema: dataset,
        constraint_name: `PK_${t.name}`,
        ordinal_position: i + 1,
      }));
  });

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
    if (ch === "'") {
      let value = '';
      i += 1;
      while (i < n) {
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            value += "'";
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        value += sql[i];
        i += 1;
      }
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
    if (/[a-zA-Z_"]/.test(ch)) {
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
  col: string;
  op: string;
  value: unknown;
  and: boolean | null;
}

interface ParsedSelect {
  items: SelectItem[];
  from?: string;
  predicates: Predicate[];
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

    // skip HAVING token(s) if present (ignored)
    if (this.is('HAVING')) {
      while (this.peek() && !this.is('ORDER') && !this.is('LIMIT')) this.next();
    }

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

    return { items, from, predicates, groupBy, orderBy, limit };
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
    this.kw('WHERE');
    const predicates: Predicate[] = [];
    for (;;) {
      let colPath = this.next().v;
      while (this.peek()?.t === 'sym' && this.peek()?.v === '.') {
        this.next();
        colPath = `${colPath}.${this.next().v}`;
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
      else throw new Error('Unsupported value in WHERE clause');
      predicates.push({ col: lastIdent(colPath).toLowerCase(), op: opStr, value, and: null });

      if (this.is('AND') || this.is('OR')) {
        const and = this.is('AND');
        this.next();
        predicates.push({ col: '', op: '', value: null, and });
        continue;
      }
      break;
    }
    return predicates;
  }
}

function matches(predicates: Predicate[], row: Record<string, unknown>): boolean {
  if (predicates.length === 0) return true;
  let result = true;
  let pendingAnd: boolean | null = null;
  for (const p of predicates) {
    if (p.and !== null) {
      pendingAnd = p.and;
      continue;
    }
    const c = comparable(row[p.col], p.value);
    let current: boolean;
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
    if (pendingAnd === null) result = current;
    else if (pendingAnd) result = result && current;
    else result = result || current;
    pendingAnd = null;
  }
  return result;
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
  if (upper === 'SUM') return values.reduce<number>((s, v) => s + v, 0);
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
          ? (Array.isArray(t.primaryKey) ? t.primaryKey[0]?.toLowerCase() : t.primaryKey.toLowerCase())
          : undefined,
      }));
    this.tables = [...seeded, ...makeCatalog(dataset, seeded)];
    this.connected = true;
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult & { rows: T[] }> {
    await this.connect();
    return this.run(sql) as QueryResult & { rows: T[] };
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
      resultRows = [...groups.entries()].map(([, group]) => {
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
        resultRows = resultRows.filter((r) => Object.keys(r).length > 0);
      } else {
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