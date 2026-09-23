import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe.skipIf(process.env.AVA_MYSQL_TEST !== '1')('loaders/mysql', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads MySQL with a complete schema', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const schema = await engine.load({
      type: 'mysql',
      options: {
        host: '127.0.0.1',
        port: Number(process.env.AVA_MYSQL_TEST_PORT ?? 13306),
        database: 'ava_mysql_test',
        user: 'ava_test',
        password: 'ava_test_password',
      },
    });

    expect(schema).toEqual({
      tables: [
        {
          name: 'customers',
          columnCount: 6,
          fields: [
            { name: 'tenant_id', type: 'int', nullable: false },
            { name: 'customer_id', type: 'int', nullable: false },
            { name: 'name', type: 'varchar(100)', nullable: false },
            { name: 'email', type: 'varchar(150)', nullable: true },
            { name: 'created_on', type: 'date', nullable: false },
            { name: 'profile', type: 'json', nullable: true },
          ],
          indexes: [
            { name: 'PRIMARY', columns: ['tenant_id', 'customer_id'], unique: true, primary: true },
            { name: 'uq_customers_email', columns: ['tenant_id', 'email'], unique: true, primary: false },
          ],
        },
        {
          name: 'order notes',
          columnCount: 2,
          fields: [
            { name: 'order_id', type: 'bigint unsigned', nullable: true },
            { name: 'note"text', type: 'text', nullable: true },
          ],
          indexes: [],
        },
        {
          name: 'orders',
          columnCount: 7,
          fields: [
            { name: 'order_id', type: 'bigint unsigned', nullable: false },
            { name: 'tenant_id', type: 'int', nullable: false },
            { name: 'customer_id', type: 'int', nullable: false },
            { name: 'amount', type: 'decimal(10,2)', nullable: false },
            { name: 'status', type: "enum('pending','paid','cancelled')", nullable: false },
            { name: 'placed_at', type: 'datetime', nullable: false },
            { name: 'note', type: 'text', nullable: true },
          ],
          indexes: [
            { name: 'idx_orders_customer', columns: ['tenant_id', 'customer_id'], unique: false, primary: false },
            { name: 'idx_orders_status_time', columns: ['status', 'placed_at'], unique: false, primary: false },
            { name: 'PRIMARY', columns: ['order_id'], unique: true, primary: true },
          ],
        },
      ],
      relations: [
        {
          name: 'fk_orders_customer',
          kind: 'foreign-key',
          from: { table: 'orders', columns: ['tenant_id', 'customer_id'] },
          to: { table: 'customers', columns: ['tenant_id', 'customer_id'] },
        },
      ],
    });
  }, 30000);
});
