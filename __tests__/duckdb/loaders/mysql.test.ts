/**
 * MySQL load/schema 测试，测试库定义位于 __tests__/datasets/mysql。
 * 默认 skip：仅在 AVA_MYSQL_TEST=1 时执行，测试不会自动启动数据库。
 *
 * 1. 启动测试库并等待就绪：
 *    open -a OrbStack
 *    docker info
 *    docker compose -f __tests__/datasets/mysql/compose.yaml up -d --wait
 * 2. 启用并运行 schema 对比测试：
 *    AVA_MYSQL_TEST=1 npx vitest run __tests__/duckdb/loaders/mysql.test.ts
 * 3. 测完清理测试库及数据卷：
 *    docker compose -f __tests__/datasets/mysql/compose.yaml stop
 *    docker compose -f __tests__/datasets/mysql/compose.yaml down -v
 *
 * 默认连接 127.0.0.1:13306；修改端口时，Compose 和测试须设置相同的 AVA_MYSQL_TEST_PORT。
 */
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
