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
    const schema = await engine.load({
      type: 'postgresql',
      options: {
        host: '127.0.0.1',
        port: Number(process.env.AVA_POSTGRESQL_TEST_PORT ?? 15432),
        database: 'ava_postgresql_test',
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
            { name: 'tenant_id', type: 'integer', nullable: false },
            { name: 'customer_id', type: 'integer', nullable: false },
            { name: 'name', type: 'character varying(100)', nullable: false },
            { name: 'email', type: 'character varying(150)', nullable: true },
            { name: 'created_on', type: 'date', nullable: false },
            { name: 'profile', type: 'jsonb', nullable: true },
          ],
          indexes: [
            { name: 'customers_pkey', columns: ['tenant_id', 'customer_id'], unique: true, primary: true },
            { name: 'uq_customers_email', columns: ['tenant_id', 'email'], unique: true, primary: false },
          ],
        },
        {
          name: 'order notes',
          columnCount: 2,
          fields: [
            { name: 'order_id', type: 'bigint', nullable: true },
            { name: 'note"text', type: 'text', nullable: true },
          ],
          indexes: [],
        },
        {
          name: 'orders',
          columnCount: 7,
          fields: [
            { name: 'order_id', type: 'bigint', nullable: false },
            { name: 'tenant_id', type: 'integer', nullable: false },
            { name: 'customer_id', type: 'integer', nullable: false },
            { name: 'amount', type: 'numeric(10,2)', nullable: false },
            { name: 'status', type: 'order_status', nullable: false },
            { name: 'placed_at', type: 'timestamp without time zone', nullable: false },
            { name: 'note', type: 'text', nullable: true },
          ],
          indexes: [
            { name: 'idx_orders_customer', columns: ['tenant_id', 'customer_id'], unique: false, primary: false },
            { name: 'idx_orders_status_time', columns: ['status', 'placed_at'], unique: false, primary: false },
            { name: 'orders_pkey', columns: ['order_id'], unique: true, primary: true },
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
