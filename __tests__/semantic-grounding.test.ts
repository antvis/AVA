import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { validateSemanticQuery } from '../src/duckdb/semantic';
import { compileSMQ, getDialect, inferDialect } from '../src/semantic/compiler';
import { SemanticRegistry } from '../src/semantic/registry';

import type { DuckDBConnection } from '@duckdb/node-api';
import type { Schema } from '../src';

const schema = {
  tables: [
    { name: 'orders', fields: ['id', 'amount', 'secret', 'tags'].map((name) => ({ name, type: 'VARCHAR' })) },
    { name: 'customers', fields: ['id', 'name'].map((name) => ({ name, type: 'VARCHAR' })) },
    { name: 'private.orders', fields: [{ name: 'secret', type: 'VARCHAR' }] },
  ],
} as Schema;
const fragments = ['SELECT o.id, o.amount, o.tags FROM orders o', 'SELECT c.id, c.name FROM customers c'];
let db: DuckDBInstance;
let conn: DuckDBConnection;
beforeAll(async () => {
  db = await DuckDBInstance.create(':memory:');
  conn = await db.connect();
  await conn.run('CREATE TABLE orders (id VARCHAR, amount INT, secret INT, tags INT[])');
  await conn.run('CREATE TABLE customers (id VARCHAR, name VARCHAR)');
});
afterAll(() => {
  conn.closeSync();
  db.closeSync();
});

describe('native semantic grounding', () => {
  it.each([
    'SELECT SUM(o.amount) FROM orders o',
    'SELECT amount FROM main.orders',
    'WITH x AS (SELECT amount a FROM orders) SELECT MAX(a) FROM x',
    'WITH x(v) AS (SELECT amount FROM orders) SELECT v FROM x',
    'WITH x AS (SELECT amount FROM orders) SELECT * FROM x',
    'SELECT * FROM (SELECT amount AS a, amount + 1 FROM orders) x WHERE a > 1',
    'SELECT a FROM (SELECT amount + 1, amount AS a FROM orders) x',
    'WITH x AS (SELECT amount AS a, amount + 1 FROM orders), y AS (SELECT * FROM x) SELECT a FROM y',
    'SELECT o.id FROM orders o WHERE EXISTS (SELECT 1 FROM customers c WHERE c.id=o.id)',
    'SELECT row_number() OVER (ORDER BY id), amount FROM orders',
    'SELECT unnest(tags) AS tag FROM orders',
    'SELECT amount + 1 AS v FROM orders ORDER BY v',
    'SELECT id FROM orders UNION ALL SELECT id FROM customers',
    'WITH RECURSIVE n(v) AS (SELECT CAST(id AS INT) FROM orders UNION ALL SELECT v+1 FROM n WHERE v < 3) SELECT v FROM n',
    'WITH RECURSIVE n AS (SELECT amount AS v FROM orders UNION ALL SELECT v+1 FROM n WHERE v < 3) SELECT v FROM n',
    "SELECT 'FROM secrets' AS text, amount FROM orders -- JOIN secrets",
  ])('accepts grounded composition: %s', async (sql) => {
    await expect(validateSemanticQuery(conn, sql, fragments, schema)).resolves.toBeUndefined();
  });

  it.each([
    'SELECT secret FROM orders',
    'SELECT (SELECT secret FROM (SELECT 1) x) FROM orders',
    'SELECT o FROM orders o CROSS JOIN (SELECT 1) x',
    'WITH orders AS (SELECT secret FROM orders) SELECT secret FROM orders',
    'WITH x AS (SELECT id FROM customers) SELECT o.secret FROM orders o JOIN x ON o.id=x.id',
    'SELECT o.secret FROM orders o',
    'SELECT * FROM orders',
    'SELECT orders FROM orders',
    'SELECT * FROM orders, private.orders',
    'SELECT amount FROM orders WHERE EXISTS (SELECT 1 FROM private.orders)',
    'WITH x AS (SELECT secret FROM orders) SELECT 1 FROM x',
    'WITH x AS (SELECT id FROM customers) SELECT secret FROM orders',
    'SELECT a FROM (SELECT amount AS a, secret + 1 FROM orders) x',
    'SELECT (SELECT secret FROM (SELECT amount + 1) x) FROM orders',
    'WITH RECURSIVE n AS (SELECT amount AS v FROM orders UNION ALL SELECT secret FROM orders, n WHERE v < 3) SELECT v FROM n',
    "SELECT * FROM read_csv('/tmp/data.csv')",
    'SELECT * FROM information_schema.tables',
    'SELECT id FROM orders; SELECT id FROM customers',
    'DELETE FROM orders WHERE amount > 0',
  ])('rejects ungrounded reads: %s', async (sql) => {
    await expect(validateSemanticQuery(conn, sql, fragments, schema)).rejects.toThrow();
  });

  it('does not grant every column after COUNT(*)', async () => {
    await expect(
      validateSemanticQuery(conn, 'SELECT amount FROM orders', ['SELECT COUNT(*) FROM orders'], schema)
    ).rejects.toThrow('Column');
    await expect(
      validateSemanticQuery(conn, 'SELECT COUNT(*) FROM orders', ['SELECT COUNT(*) FROM orders'], schema)
    ).resolves.toBeUndefined();
  });

  it('rejects copied preview constants without a data query', async () => {
    await expect(validateSemanticQuery(conn, 'SELECT [5, 5] AS answer', fragments, schema)).rejects.toThrow(
      'Compute the answer from grounded data'
    );
  });

  it('returns binding errors before final execution', async () => {
    await expect(validateSemanticQuery(conn, 'SELECT SUM(id) FROM orders', fragments, schema)).rejects.toThrow(
      'Binder Error'
    );
    await expect(
      validateSemanticQuery(conn, 'SELECT id FROM orders o JOIN customers c ON o.id=c.id', fragments, schema)
    ).rejects.toThrow('Ambiguous');
  });
});

describe('SMQ query targets and expression joins', () => {
  const registry = new SemanticRegistry({
    models: [
      {
        name: 'sales',
        table: 'orders',
        dimensions: [{ name: 'id', column: 'id' }],
        measures: [{ name: 'amount', column: 'amount' }],
        metrics: [{ name: 'revenue', agg: 'sum', column: 'amount' }],
      },
      { name: 'buyers', table: 'customers', dimensions: [{ name: 'name', column: 'name' }] },
    ],
    joins: [{ from: 'sales', to: 'buyers', on: 'TRIM({FROM}."id") = TRIM({TO}."id")' }],
  });

  it('preserves duplicate rows and never invents SUM for raw measures', async () => {
    const { sql } = compileSMQ(registry, { metrics: ['sales__amount'] });
    expect(sql).not.toMatch(/DISTINCT|SUM|GROUP BY/);
    await conn.run("INSERT INTO orders VALUES (' 1 ', 5, 9, [1]), (' 1 ', 5, 8, [2])");
    expect((await conn.runAndReadAll(sql)).getRows()).toEqual([[5], [5]]);
  });

  it('resolves bare aggregates and compiles transformed joins in both directions', async () => {
    await conn.run("INSERT INTO customers VALUES ('1', 'A')");
    const { sql } = compileSMQ(registry, { metrics: ['revenue'], group_by: ['buyers__name'] });
    expect((await conn.runAndReadAll(sql)).getRows()).toEqual([['A', 10n]]);
    const reverse = compileSMQ(registry, { metrics: ['buyers__name'], group_by: ['sales__id'] }).sql;
    expect(reverse).toContain('RIGHT JOIN');
    expect(reverse).toContain('TRIM("sales"."id") = TRIM("buyers"."id")');
  });

  it('does not reveal physical table names during discovery', () => {
    expect(registry.elements().every((element) => !('table' in element))).toBe(true);
    expect(registry.elements().some((element) => element.name === 'revenue')).toBe(true);
  });

  it('rejects ambiguous metric names and unknown protocol fields', () => {
    const ambiguous = new SemanticRegistry({
      models: ['a', 'b'].map((name) => ({ name, table: name, metrics: [{ name: 'n', agg: 'count' }] })),
    });
    expect(() => compileSMQ(ambiguous, { metrics: ['n'] })).toThrow('Ambiguous');
    expect(compileSMQ(ambiguous, { metrics: ['a__n'] }).sql).toContain('COUNT(*)');
    expect(() => compileSMQ(registry, { metrics: ['revenue'], typo: true } as never)).toThrow();
  });

  it('returns compilable names for metrics containing the element separator', () => {
    const semantic = new SemanticRegistry({
      models: [{ name: 'sales', table: 'orders', metrics: [{ name: 'gross__total', agg: 'sum', column: 'amount' }] }],
    });
    const [metric] = semantic.elements();
    expect(metric.name).toBe('sales__gross__total');
    expect(compileSMQ(semantic, { metrics: [metric.name] }).sql).toContain('SUM("sales"."amount")');
  });

  it('escapes GoogleSQL literals and detects unsupported execution dialects', () => {
    expect(getDialect('bigquery').quoteIdentifier('a`b')).toBe('`a\\`b`');
    expect(getDialect('bigquery').quoteString("it's")).toBe("'it\\'s'");
    expect(() => inferDialect('Python')).toThrow('Cannot infer');
    expect(inferDialect('Snowflake SQL')).toBe('snowflake');
  });

  it('renders backend identifiers without silently treating unknown engines as DuckDB', () => {
    expect(compileSMQ(registry, { metrics: ['revenue'] }, 'snowflake').sql).toContain('SUM("sales"."amount")');
    const cloud = new SemanticRegistry({
      dialect: 'bigquery',
      models: [{ name: 'sales', table: 'my-project.dataset.orders', metrics: [{ name: 'count', agg: 'count' }] }],
    });
    expect(compileSMQ(cloud, { metrics: ['count'] }).sql).toContain('FROM `my-project.dataset.orders`');
  });
});
