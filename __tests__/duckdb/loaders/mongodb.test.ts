import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

function mongoConnection(port: number): string {
  return ['mongodb', '://', 'ava_test', ':', 'ava_test_password', `@127.0.0.1:${port}`, '/?authSource=ava_mongodb_test'].join(
    ''
  );
}

describe.skipIf(process.env.AVA_MONGODB_TEST !== '1')('loaders/mongodb', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads MongoDB collections with an inferred schema', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const schema = await engine.load({
      type: 'mongodb',
      options: {
        connection: mongoConnection(Number(process.env.AVA_MONGODB_TEST_PORT ?? 17017)),
        database: 'ava_mongodb_test',
      },
    });

    expect(schema.tables.map(({ name }) => name)).toEqual(['customers', 'order notes', 'orders']);
    expect(schema.tables.every(({ indexes }) => indexes.length === 0)).toBe(true);
    expect(schema.relations).toEqual([]);
    expect(schema.tables.find(({ name }) => name === 'customers')).toMatchObject({
      fields: expect.arrayContaining([
        { name: '_id', nullable: true },
        { name: 'tenant_id', nullable: true },
        { name: 'customer_id', nullable: true },
        { name: 'created_on', nullable: true },
      ]),
    });
    expect(schema.tables.find(({ name }) => name === 'orders')).toMatchObject({
      fields: expect.arrayContaining([
        { name: '_id', nullable: true },
        { name: 'order_id', nullable: true },
        { name: 'amount', nullable: true },
        { name: 'placed_at', nullable: true },
      ]),
    });
    expect(schema.tables.find(({ name }) => name === 'order notes')).toMatchObject({
      fields: expect.arrayContaining([{ name: '_id', nullable: true }, { name: 'order_id', nullable: true }]),
    });
  }, 30000);
});
