import { afterEach, describe, expect, it } from 'vitest';

import { BigQueryEngine } from '../../../src/remote/bigquery';
import { getLLMConfig } from '../../test-utils';

import type { BigQuerySourceOptions } from '../../../src/types';

/**
 * Runs against real BigQuery; see __tests__/datasets/bigquery/README.md.
 * Credentials come from Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS).
 */
const enabled = process.env.AVA_BIGQUERY_TEST === '1';
const projectId = process.env.AVA_BIGQUERY_PROJECT;
const dataset = process.env.AVA_BIGQUERY_DATASET ?? 'ava_bigquery_test';

describe.skipIf(!enabled)('bigquery/engine', () => {
  let engine: BigQueryEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  async function load(options: Partial<BigQuerySourceOptions> = {}) {
    engine = new BigQueryEngine(getLLMConfig());
    await engine.load({ type: 'bigquery', options: { projectId, dataset, ...options } });
    return engine;
  }

  it('discovers tables, nested types, keys, relationships and views', async () => {
    const schema = await (await load()).schema();

    expect(schema.models.map(({ name }) => name)).toEqual([
      'customers',
      'order notes',
      'orders',
      'paid_orders',
      'value_types',
    ]);
    const customers = schema.models.find(({ name }) => name === 'customers')!;
    expect(customers).toMatchObject({
      primaryKey: 'customer_id',
      tableReference: { schema: dataset, table: 'customers' },
      columns: [
        { name: 'customer_id', type: 'INT64', notNull: true },
        { name: 'tenant_id', type: 'INT64', notNull: true },
        { name: 'name', type: 'STRING', notNull: true },
        { name: 'email', type: 'STRING', notNull: false },
        { name: 'created_on', type: 'DATE', notNull: true },
        { name: 'profile', type: 'JSON', notNull: false },
        { name: 'tags', type: 'ARRAY<STRING>', notNull: false },
        { name: 'address', type: 'STRUCT<city STRING, zip STRING>', notNull: false },
      ],
    });
    expect(schema.models.find(({ name }) => name === 'orders')?.columns).toContainEqual({
      name: 'amount',
      type: 'NUMERIC(10, 2)',
      notNull: true,
    });
    expect(schema.relationships).toEqual([
      {
        name: 'fk_notes_order',
        models: ['order notes', 'orders'],
        joinType: 'MANY_TO_ONE',
        condition: '`order notes`.`order_id` = `orders`.`order_id`',
      },
      {
        name: 'fk_orders_customer',
        models: ['orders', 'customers'],
        joinType: 'MANY_TO_ONE',
        condition: '`orders`.`customer_id` = `customers`.`customer_id`',
      },
    ]);
    expect(schema.views).toEqual([{ name: 'paid_orders', statement: expect.stringContaining("status = 'paid'") }]);
  }, 60000);

  it('limits discovery to the requested tables', async () => {
    const schema = await (await load({ tables: ['orders', 'paid_orders'] })).schema();
    expect(schema.models.map(({ name }) => name)).toEqual(['orders', 'paid_orders']);
    // The referenced customers table is not exposed, so the foreign key is not a relationship.
    expect(schema.relationships).toEqual([]);
    await expect((await load({ tables: ['orders', 'missing'] })).schema()).rejects.toThrow('"missing"');
  }, 60000);

  it('executes bounded queries in result order with native column types', async () => {
    await load();
    const truncated = await engine!.execute('SELECT order_id, amount FROM orders ORDER BY order_id DESC', {
      maxRows: 2,
    });
    expect(truncated).toEqual({
      data: [
        { order_id: 1004, amount: 34.6 },
        { order_id: 1003, amount: 10 },
      ],
      schema: [
        { name: 'order_id', type: 'INT64' },
        { name: 'amount', type: 'NUMERIC' },
      ],
      truncated: true,
      truncatedBy: 'maxRows',
      rowCount: undefined,
    });

    const complete = await engine!.execute(
      'SELECT n.`note text` AS note FROM `order notes` AS n JOIN orders USING (order_id) ORDER BY order_id;'
    );
    expect(complete).toMatchObject({ data: [{ note: 'gift wrap' }, { note: null }], rowCount: 2 });
    expect(complete.truncated).toBeUndefined();
  }, 60000);

  it('converts every GoogleSQL type to JSON without losing precision', async () => {
    await load();
    const { data, schema } = await engine!.execute('SELECT * FROM value_types');
    expect(data).toEqual([
      {
        big_int: '9007199254740993',
        small_int: 42,
        not_a_number: 'NaN',
        float_value: 1.5,
        wide_numeric: '12345678901234567890.123456789',
        exact_numeric: 19.9,
        big_numeric: 0.1,
        flag: true,
        text: 'hé "quoted"',
        raw_bytes: 'AP8=',
        first_day: '0001-01-01',
        last_datetime: '9999-12-31T23:59:59.999999',
        clock: '12:34:56.000001',
        before_epoch: '1969-12-31T23:59:59.999999Z',
        point: 'POINT(120.15 30.28)',
        document: { a: [1, 2, { b: null }] },
        duration: '1-2 3 4:5:6',
        period: '[2024-01-01, 2024-02-01)',
        numbers: [1, 2, 3],
        nested: { x: 7, y: [{ z: 'z1' }, { z: 'z2' }] },
        missing: null,
      },
    ]);
    expect(schema).toContainEqual({ name: 'nested', type: 'STRUCT<x INT64, y ARRAY<STRUCT<z STRING>>>' });
    expect(schema).toContainEqual({ name: 'period', type: 'RANGE<DATE>' });
  }, 60000);

  it('rejects anything but one SELECT before it runs', async () => {
    await load();
    for (const sql of [
      'SELECT 1; SELECT 2',
      'DELETE FROM orders WHERE TRUE',
      "UPDATE orders SET status = 'x' WHERE TRUE",
      'DROP TABLE orders',
      'CREATE TEMP TABLE t AS SELECT 1 AS x',
      "EXPORT DATA OPTIONS (uri = 'gs://ava-must-not-write/*.csv', format = 'CSV') AS SELECT 1 AS x",
      'SELECT (',
    ]) {
      await expect(engine!.execute(sql), sql).rejects.toThrow();
    }
    await expect(engine!.execute('SELECT COUNT(*) AS n FROM orders')).resolves.toMatchObject({ data: [{ n: 4 }] });
  }, 120000);

  it('stops queries above maximumBytesBilled without billing them', async () => {
    await load({ maximumBytesBilled: 1 });
    // CURRENT_TIMESTAMP keeps the query out of the result cache, so bytes are always billed.
    await expect(engine!.execute('SELECT order_id, CURRENT_TIMESTAMP() AS now FROM orders')).rejects.toThrow(
      /bytesBilledLimitExceeded[\s\S]*maximumBytesBilled/
    );
  }, 60000);

  it('cancels jobs that outlive queryTimeoutMs', async () => {
    await load({ queryTimeoutMs: 1500 });
    await expect(
      engine!.execute(
        'SELECT COUNT(DISTINCT FARM_FINGERPRINT(CONCAT(CAST(a AS STRING), "-", CAST(b AS STRING)))) AS n ' +
          'FROM UNNEST(GENERATE_ARRAY(1, 20000)) AS a CROSS JOIN UNNEST(GENERATE_ARRAY(1, 20000)) AS b'
      )
    ).rejects.toThrow('queryTimeoutMs');
  }, 60000);

  it('profiles the fixture tables in GoogleSQL', async () => {
    await load({ tables: ['customers', 'orders'] });
    const profile = await engine!.profile(await engine!.schema(), {
      metrics: [
        'row_count',
        'null_count',
        'distinct_count',
        'duplicate_count',
        { id: 'top_values', maxDistinctRatio: 1 },
        'min',
        'max',
        'mean',
      ],
    });

    expect(profile.models.map(({ name, metrics }) => ({ name, metrics }))).toEqual([
      { name: 'customers', metrics: { row_count: 3 } },
      { name: 'orders', metrics: { row_count: 4 } },
    ]);
    const columns = (model: string) => profile.models.find(({ name }) => name === model)!.columns;
    expect(columns('customers').find(({ name }) => name === 'created_on')).toMatchObject({
      properties: { logicalType: 'date' },
      metrics: { null_count: 0, distinct_count: 2, min: Date.UTC(2024, 0, 10), max: Date.UTC(2024, 1, 20) },
    });
    expect(columns('customers').find(({ name }) => name === 'tags')).toMatchObject({
      properties: { logicalType: 'unknown' },
      metrics: { null_count: 0, duplicate_count: 0 },
    });
    expect(columns('orders').find(({ name }) => name === 'amount')).toMatchObject({
      properties: { logicalType: 'numeric' },
      metrics: { null_count: 0, distinct_count: 4, min: 10, max: 35.5, mean: 25 },
    });
    expect(columns('orders').find(({ name }) => name === 'status')?.metrics.top_values).toEqual([
      { value: 'paid', count: 2 },
      { value: 'cancelled', count: 1 },
      { value: 'pending', count: 1 },
    ]);
  }, 120000);

  it('reads a public dataset while running jobs in the configured project', async () => {
    await load({ dataset: 'bigquery-public-data.thelook_ecommerce', tables: ['orders', 'users'] });
    const schema = await engine!.schema();
    expect(schema.models.map(({ name }) => name)).toEqual(['orders', 'users']);
    expect(schema.models[0].tableReference).toEqual({
      catalog: 'bigquery-public-data',
      schema: 'thelook_ecommerce',
      table: 'orders',
    });
    const result = await engine!.execute('SELECT COUNT(*) AS orders FROM orders');
    expect(result.data[0].orders).toBeGreaterThan(0);
  }, 60000);
});
