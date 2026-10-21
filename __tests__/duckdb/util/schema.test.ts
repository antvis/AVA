import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { getDuckDBSchema } from '../../../src/duckdb/util/schema';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('getDuckDBSchema', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
  });

  afterEach(() => {
    connection?.closeSync();
    db?.closeSync();
  });

  it('discovers qualified models, ordered columns, composite keys and constraint-backed cardinalities', async () => {
    await connection.run(`
      CREATE SCHEMA analytics;
      USE analytics;
      CREATE TABLE customers(tenant_id INTEGER, id INTEGER, email VARCHAR,
        PRIMARY KEY(tenant_id, id), UNIQUE(email));
      CREATE TABLE orders(id INTEGER PRIMARY KEY, tenant_id INTEGER, customer_id INTEGER, amount DOUBLE,
        FOREIGN KEY(tenant_id, customer_id) REFERENCES customers(tenant_id, id));
      CREATE TABLE details(order_id INTEGER UNIQUE REFERENCES orders(id), note VARCHAR);
      CREATE INDEX idx_orders_customer ON orders(customer_id);
    `);
    const query = vi.spyOn(connection, 'runAndReadAll');
    const schema = await getDuckDBSchema(connection);
    const rows = (await query.mock.results[0].value).getRowObjectsJson();
    expect(rows.every((row) => typeof row.metadata === 'object' && row.metadata !== null)).toBe(true);
    expect(schema).toMatchSnapshot();
  });

  it('discovers unique index keys without exposing secondary indexes', async () => {
    await connection.run(`
      CREATE TABLE indexed(id INTEGER, value VARCHAR);
      CREATE UNIQUE INDEX unique_id ON indexed(id);
      CREATE INDEX by_value ON indexed(value);
    `);
    const schema = await getDuckDBSchema(connection);
    expect(schema).toEqual({
      models: [
        {
          name: 'indexed',
          tableReference: { catalog: 'memory', schema: 'main', table: 'indexed' },
          columns: [
            { name: 'id', type: 'INTEGER', notNull: false },
            { name: 'value', type: 'VARCHAR', notNull: false },
          ],
          uniqueKeys: ['id'],
        },
      ],
      relationships: [],
      views: [],
    });
  });

  it('preserves CTEs, joins, aggregates, windows and nested views in a qualified namespace', async () => {
    await connection.run(`
      CREATE SCHEMA analytics;
      USE analytics;
      CREATE TABLE customers(id INTEGER PRIMARY KEY, name VARCHAR);
      CREATE TABLE orders(customer_id INTEGER REFERENCES customers(id), amount INTEGER, status VARCHAR);

      CREATE VIEW "sales.report AS ""quoted" ("customer, name", "total AS ""net", "position") AS
      WITH totals AS (
        SELECT c.name, CAST(COALESCE(SUM(o.amount) FILTER (WHERE o.status = 'paid'), 0) AS INTEGER) AS total
        FROM customers c LEFT JOIN orders o ON c.id = o.customer_id
        GROUP BY c.name
      )
      SELECT name, total, CAST(ROW_NUMBER() OVER (ORDER BY total DESC, name) AS INTEGER) FROM totals;

      CREATE VIEW "top customers" AS
      SELECT * FROM "sales.report AS ""quoted" WHERE "total AS ""net" >= 50
      UNION ALL SELECT 'literal AS ; --', 0, 99;
      CREATE VIEW main."top customers" AS SELECT -1 AS hidden;
    `);

    expect({
      schema: await getDuckDBSchema(connection),
      selected: await getDuckDBSchema(connection, ['top customers']),
    }).toMatchSnapshot();
  });

  it('discovers replaced view definitions and preserves columns when the query returns no rows', async () => {
    await connection.run('CREATE VIEW current_view AS SELECT 1 AS original');
    const before = await getDuckDBSchema(connection, ['current_view']);

    await connection.run(`
      CREATE OR REPLACE VIEW current_view ("empty, value", "label AS text") AS
      WITH RECURSIVE sequence(n) AS (
        SELECT 1 UNION ALL SELECT n + 1 FROM sequence WHERE n < 3
      )
      SELECT n, 'AS ;' FROM sequence WHERE n > 10;
    `);
    const after = await getDuckDBSchema(connection, ['current_view']);
    expect({ before, after }).toMatchSnapshot();
  });

  it('respects the selected namespace and safely filters names without dangling relationships', async () => {
    await connection.run(`
      CREATE TABLE "O'Reilly"(id INTEGER PRIMARY KEY);
      CREATE TABLE child(parent_id INTEGER REFERENCES "O'Reilly"(id));
      CREATE SCHEMA hidden;
      CREATE TABLE hidden.secret(id INTEGER);
    `);
    const schema = await getDuckDBSchema(connection, ["O'Reilly"]);
    expect(schema).toEqual({
      models: [
        {
          name: "O'Reilly",
          tableReference: { catalog: 'memory', schema: 'main', table: "O'Reilly" },
          columns: [{ name: 'id', type: 'INTEGER', notNull: true }],
          primaryKey: 'id',
        },
      ],
      relationships: [],
      views: [],
    });
    expect(await getDuckDBSchema(connection, ['missing'])).toEqual({ models: [], relationships: [], views: [] });
  });

  it('skips querying when no tables are requested', async () => {
    const runAndReadAll = vi.fn();
    expect(await getDuckDBSchema({ run: vi.fn(), runAndReadAll }, [])).toEqual({
      models: [],
      relationships: [],
      views: [],
    });
    expect(runAndReadAll).not.toHaveBeenCalled();
  });
});
