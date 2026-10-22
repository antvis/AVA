import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe.skipIf(process.env.AVA_POSTGRESQL_TEST !== '1')('loaders/postgresql', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads PostgreSQL with a complete schema', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'postgresql',
      options: {
        host: '127.0.0.1',
        port: Number(process.env.AVA_POSTGRESQL_TEST_PORT ?? 15432),
        database: 'ava_postgresql_test',
        user: 'ava_test',
        password: 'ava_test_password',
      },
    });
    const schema = await engine.schema();

    expect(engine.language.name).toBe('DuckDB SQL dialect');
    expect(
      (await engine.execute('SELECT list_transform([1, 2], lambda x: x + 1) AS values FROM customers LIMIT 1')).data
    ).toEqual([{ values: [2, 3] }]);
    expect(
      (
        await engine.execute(`SELECT c.name, SUM(o.amount) AS total FROM orders o
        JOIN customers c USING (tenant_id, customer_id) GROUP BY c.name ORDER BY c.name`)
      ).data
    ).toEqual([
      { name: 'Alice', total: 55.4 },
      { name: 'Bob', total: 10 },
      { name: 'Carol', total: 34.6 },
    ]);
    expect(await engine.execute('SELECT * FROM orders', { maxRows: 1 })).toMatchObject({ truncated: true });

    expect(schema).toEqual({
      models: [
        {
          name: 'customers',
          columns: [
            { name: 'tenant_id', type: 'integer', notNull: true },
            { name: 'customer_id', type: 'integer', notNull: true },
            { name: 'name', type: 'character varying(100)', notNull: true },
            { name: 'email', type: 'character varying(150)', notNull: false },
            { name: 'created_on', type: 'date', notNull: true },
            { name: 'profile', type: 'jsonb', notNull: false },
          ],
          primaryKey: ['tenant_id', 'customer_id'],
          uniqueKeys: [['tenant_id', 'email']],
          tableReference: { table: 'customers' },
        },
        {
          name: 'order notes',
          columns: [
            { name: 'order_id', type: 'bigint', notNull: false },
            { name: 'note"text', type: 'text', notNull: false },
          ],
          tableReference: { table: 'order notes' },
        },
        {
          name: 'orders',
          columns: [
            { name: 'order_id', type: 'bigint', notNull: true },
            { name: 'tenant_id', type: 'integer', notNull: true },
            { name: 'customer_id', type: 'integer', notNull: true },
            { name: 'amount', type: 'numeric(10,2)', notNull: true },
            { name: 'status', type: 'order_status', notNull: true },
            { name: 'placed_at', type: 'timestamp without time zone', notNull: true },
            { name: 'note', type: 'text', notNull: false },
          ],
          primaryKey: 'order_id',
          tableReference: { table: 'orders' },
        },
      ],
      relationships: [
        {
          name: 'fk_orders_customer',
          models: ['orders', 'customers'],
          joinType: 'MANY_TO_ONE',
          condition:
            '"orders"."tenant_id" = "customers"."tenant_id" AND "orders"."customer_id" = "customers"."customer_id"',
        },
      ],
      views: [],
    });
  }, 30000);
});
