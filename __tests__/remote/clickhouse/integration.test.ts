import { afterEach, describe, expect, it } from 'vitest';

import { ClickHouseEngine } from '../../../src/remote/clickhouse';
import { getLLMConfig } from '../../test-utils';

describe.skipIf(process.env.AVA_CLICKHOUSE_TEST !== '1')('clickhouse/engine', () => {
  let engine: ClickHouseEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  async function load() {
    engine = new ClickHouseEngine(getLLMConfig());
    return engine.load({
      type: 'clickhouse',
      options: {
        url: `http://127.0.0.1:${Number(process.env.AVA_CLICKHOUSE_TEST_PORT ?? 13123)}`,
        database: 'ava_clickhouse_test',
        username: 'ava_test',
        password: 'ava_test_password',
        clickhouse_settings: { readonly: '0' },
      },
    });
  }

  it('discovers the ClickHouse fixture schema', async () => {
    const schema = await load();

    expect(schema.tables.map(({ name }) => name)).toEqual(['customers', 'order notes', 'orders']);
    expect(schema.tables.find(({ name }) => name === 'customers')).toMatchObject({
      fields: expect.arrayContaining([
        { name: 'tenant_id', type: 'UInt32', nullable: false },
        { name: 'email', type: 'Nullable(String)', nullable: true },
      ]),
      indexes: [{ name: 'primary_key', columns: ['tenant_id', 'customer_id'], unique: false, primary: true }],
    });
    expect(schema.tables.find(({ name }) => name === 'orders')).toMatchObject({
      fields: expect.arrayContaining([
        { name: 'amount', type: expect.stringContaining('Decimal(10'), nullable: false },
        { name: 'status', type: expect.stringContaining("Enum8('pending'"), nullable: false },
      ]),
      indexes: [{ name: 'primary_key', columns: ['order_id'], unique: false, primary: true }],
    });
    expect(schema.relations).toEqual([]);
  }, 30000);

  it('executes bounded read-only queries', async () => {
    await load();
    const result = await engine!.execute(
      'SELECT toString(order_id) AS order_id, amount FROM orders ORDER BY order_id',
      { maxRows: 2 }
    );

    expect(result.data).toEqual([
      { order_id: '1001', amount: 19.9 },
      { order_id: '1002', amount: 35.5 },
    ]);
    expect(result.truncatedBy).toBe('maxRows');
  }, 30000);

  it('normalizes trailing comments and refuses writes or readonly overrides', async () => {
    await load();
    await expect(engine!.execute("SELECT 'it\\'s DROP; TABLE' AS value; -- trailing comment")).resolves.toMatchObject({
      data: [{ value: "it's DROP; TABLE" }],
    });
    await expect(
      engine!.execute('/* outer /* nested */ */ WITH $sql$Set; DROP$sql$ AS value SELECT value')
    ).resolves.toMatchObject({ data: [{ value: 'Set; DROP' }] });
    await expect(engine!.execute("SELECT getSetting('readonly') AS mode")).resolves.toMatchObject({
      data: [{ mode: 1 }],
    });
    for (const sql of [
      'SELECT (',
      'DROP TABLE orders',
      'INSERT INTO orders SELECT * FROM orders',
      'ALTER TABLE orders DELETE WHERE 1',
      'SELECT 1; DROP TABLE orders',
      'SELECT 1 SETTINGS readonly = 0',
      'SELECT * FROM (SELECT 1 SETTINGS readonly = 0)',
      'SELECT 1 PARALLEL WITH SELECT 2',
      "SELECT 1 INTO OUTFILE '/tmp/ava-must-not-write'",
      'SELECT 1 FORMAT CSV',
    ]) {
      await expect(engine!.execute(sql), sql).rejects.toThrow();
    }
    await expect(engine!.execute('SELECT count() AS count FROM orders')).resolves.toMatchObject({
      data: [{ count: '4' }],
    });
  }, 30000);

  it('profiles the fixture tables', async () => {
    await load();
    const profile = await engine!.profile();

    expect(profile.tables.map(({ name, metrics }) => ({ name, metrics }))).toEqual([
      { name: 'customers', metrics: { row_count: 3 } },
      { name: 'order notes', metrics: { row_count: 2 } },
      { name: 'orders', metrics: { row_count: 4 } },
    ]);
    expect(
      profile.tables.find(({ name }) => name === 'customers')?.fields.find(({ name }) => name === 'created_on')
    ).toMatchObject({
      logicalType: 'date',
      metrics: {
        null_count: 0,
        distinct_count: 2,
        min: Date.UTC(2024, 0, 10),
        max: Date.UTC(2024, 1, 20),
      },
    });
    expect(
      profile.tables.find(({ name }) => name === 'orders')?.fields.find(({ name }) => name === 'amount')
    ).toMatchObject({
      logicalType: 'numeric',
      metrics: { null_count: 0, distinct_count: 4, min: 10, max: 35.5, mean: 25 },
    });
  }, 30000);
});
