import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

function mongoConnection(port: number): string {
  return [
    'mongodb',
    '://',
    'ava_test',
    ':',
    'ava_test_password',
    `@127.0.0.1:${port}`,
    '/?authSource=ava_mongodb_test',
  ].join('');
}

describe.skipIf(process.env.AVA_MONGODB_TEST !== '1')('loaders/mongodb', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads MongoDB collections with an inferred schema', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'mongodb',
      options: {
        connection: mongoConnection(Number(process.env.AVA_MONGODB_TEST_PORT ?? 17017)),
        database: 'ava_mongodb_test',
      },
    });
    const schema = await engine.schema();

    // init.js creates three collections; information_schema returns them alphabetically
    expect(schema.models.map(({ name }) => name)).toEqual(['customers', 'order notes', 'orders']);
    // The DuckDB mongo extension maps MongoDB collections as views — indexes and
    // constraints from the source database are not exposed to DuckDB's catalog,
    // so both indexes and relations are always empty.
    expect(schema.models.every(({ indexes }) => indexes.length === 0)).toBe(true);
    expect(schema.relationships).toEqual([]);

    // ── customers ──────────────────────────────────────────────
    // init.js documents have: _id, tenant_id(NumberInt), customer_id(NumberInt),
    // name(string), email(string|null), created_on(ISODate),
    // profile({tier}|null) — the mongo extension flattens nested docs (profile_tier)
    const customers = schema.models.find(({ name }) => name === 'customers')!;
    expect(customers.columns.map((f) => f.name)).toEqual(
      expect.arrayContaining(['_id', 'tenant_id', 'customer_id', 'name', 'email', 'created_on', 'profile_tier'])
    );

    // ── orders ──────────────────────────────────────────────────
    // init.js documents have: _id, order_id(NumberLong), tenant_id(NumberInt),
    // customer_id(NumberInt), amount(Decimal128), status(string),
    // placed_at(ISODate), note(string|null)
    const orders = schema.models.find(({ name }) => name === 'orders')!;
    expect(orders.columns.map((f) => f.name)).toEqual(
      expect.arrayContaining(['_id', 'order_id', 'tenant_id', 'customer_id', 'amount', 'status', 'placed_at', 'note'])
    );

    // ── order notes ────────────────────────────────────────────
    // init.js documents have: _id, order_id(NumberLong), note"text(string|null)
    const orderNotes = schema.models.find(({ name }) => name === 'order notes')!;
    expect(orderNotes.columns.map((f) => f.name)).toEqual(expect.arrayContaining(['_id', 'order_id', 'note"text']));
  }, 30000);
});
