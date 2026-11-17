import { describe, it, expect, afterEach, vi } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { loadMySQL } from '../../../src/duckdb/loaders/mysql';
import { getLLMConfig } from '../../test-utils';

it('installs the MySQL extension before loading it and attaching the source read-only', async () => {
  const source = await loadMySQL({ host: 'localhost', database: 'analytics' });
  const conn = {
    run: vi.fn().mockResolvedValue(undefined),
    runAndReadAll: vi.fn().mockResolvedValue({ getRowObjectsJson: () => [] }),
  };

  await source.register(conn);

  expect(conn.run).toHaveBeenNthCalledWith(1, 'INSTALL mysql');
  expect(conn.run).toHaveBeenNthCalledWith(2, 'LOAD mysql');
  expect(conn.run).toHaveBeenLastCalledWith(expect.stringContaining('(TYPE mysql, READ_ONLY)'));
});

describe.skipIf(process.env.AVA_MYSQL_TEST !== '1')('loaders/mysql', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads MySQL with a complete schema', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'mysql',
      options: {
        host: '127.0.0.1',
        port: Number(process.env.AVA_MYSQL_TEST_PORT ?? 13306),
        database: 'ava_mysql_test',
        user: 'ava_test',
        password: 'ava_test_password',
      },
    });
    const schema = await engine.schema();

    expect(schema).toEqual({
      models: [
        {
          name: 'customers',
          columns: [
            { name: 'tenant_id', type: 'int', notNull: true },
            { name: 'customer_id', type: 'int', notNull: true },
            { name: 'name', type: 'varchar(100)', notNull: true },
            { name: 'email', type: 'varchar(150)', notNull: false },
            { name: 'created_on', type: 'date', notNull: true },
            { name: 'profile', type: 'json', notNull: false },
          ],
          primaryKey: ['tenant_id', 'customer_id'],
          uniqueKeys: [['tenant_id', 'email']],
          tableReference: { table: 'customers' },
        },
        {
          name: 'order notes',
          columns: [
            { name: 'order_id', type: 'bigint unsigned', notNull: false },
            { name: 'note"text', type: 'text', notNull: false },
          ],
          tableReference: { table: 'order notes' },
        },
        {
          name: 'orders',
          columns: [
            { name: 'order_id', type: 'bigint unsigned', notNull: true },
            { name: 'tenant_id', type: 'int', notNull: true },
            { name: 'customer_id', type: 'int', notNull: true },
            { name: 'amount', type: 'decimal(10,2)', notNull: true },
            { name: 'status', type: "enum('pending','paid','cancelled')", notNull: true },
            { name: 'placed_at', type: 'datetime', notNull: true },
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
