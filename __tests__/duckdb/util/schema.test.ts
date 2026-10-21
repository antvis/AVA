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
    expect(schema.models.map((model) => model.name)).toEqual(['customers', 'details', 'orders']);
    expect(schema.models.find((model) => model.name === 'orders')).toEqual({
      name: 'orders',
      tableReference: { catalog: 'memory', schema: 'analytics', table: 'orders' },
      columns: [
        { name: 'id', type: 'INTEGER', notNull: true },
        { name: 'tenant_id', type: 'INTEGER', notNull: false },
        { name: 'customer_id', type: 'INTEGER', notNull: false },
        { name: 'amount', type: 'DOUBLE', notNull: false },
      ],
      primaryKey: 'id',
    });
    expect(schema.models.find((model) => model.name === 'customers')).toMatchObject({
      primaryKey: ['tenant_id', 'id'],
      uniqueKeys: ['email'],
    });
    expect(schema.relationships).toEqual([
      expect.objectContaining({
        models: ['details', 'orders'],
        joinType: 'ONE_TO_ONE',
        condition: '"details"."order_id" = "orders"."id"',
      }),
      expect.objectContaining({
        models: ['orders', 'customers'],
        joinType: 'MANY_TO_ONE',
        condition: '"orders"."tenant_id" = "customers"."tenant_id" AND "orders"."customer_id" = "customers"."id"',
      }),
    ]);
    expect(schema.views).toEqual([]);
    expect(schema).not.toHaveProperty('tables');
    expect(schema.models[0]).not.toHaveProperty('metrics');

    expect(schema.models.find((model) => model.name === 'orders')).not.toHaveProperty('uniqueKeys');
  });

  it('discovers unique index keys without exposing secondary indexes', async () => {
    await connection.run(`
      CREATE TABLE indexed(id INTEGER, value VARCHAR);
      CREATE UNIQUE INDEX unique_id ON indexed(id);
      CREATE INDEX by_value ON indexed(value);
    `);
    const schema = await getDuckDBSchema(connection);
    expect(schema.models[0].uniqueKeys).toEqual(['id']);
    expect(schema.models[0]).not.toHaveProperty('indexes');
  });

  it('extracts executable view queries and preserves explicit output aliases and quoted identifiers', async () => {
    await connection.run(`
      CREATE VIEW "view AS ""quoted" ("output AS ""quoted") AS SELECT 'literal AS ;' AS original;
      CREATE VIEW plain_view AS SELECT 1 AS id;
    `);
    const schema = await getDuckDBSchema(connection);
    expect(schema.models.map((model) => model.name)).toEqual(['plain_view', 'view AS "quoted']);
    const view = schema.views.find((view) => view.name === 'view AS "quoted');
    expect(view.statement).not.toMatch(/^CREATE/i);
    const result = await connection.runAndReadAll(view.statement);
    expect(result.getRowObjectsJson()).toEqual([{ 'output AS "quoted': 'literal AS ;' }]);
    expect(schema.views.find((view) => view.name === 'plain_view').statement).toBe('SELECT 1 AS id');
  });

  it('respects the selected namespace and safely filters names without dangling relationships', async () => {
    await connection.run(`
      CREATE TABLE "O'Reilly"(id INTEGER PRIMARY KEY);
      CREATE TABLE child(parent_id INTEGER REFERENCES "O'Reilly"(id));
      CREATE SCHEMA hidden;
      CREATE TABLE hidden.secret(id INTEGER);
    `);
    const schema = await getDuckDBSchema(connection, ["O'Reilly"]);
    expect(schema.models.map((model) => model.name)).toEqual(["O'Reilly"]);
    expect(schema.relationships).toEqual([]);
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
