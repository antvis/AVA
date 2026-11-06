import { afterEach, describe, expect, it } from 'vitest';

import { SQLServerEngine } from '../../../src/remote/sqlserver';
import { BUILTIN_METRICS, profileTables } from '../../../src/remote/sqlserver/profile';
import { getSQLServerSchema } from '../../../src/remote/sqlserver/schema';
import { DEFAULT_METRICS } from '../../../src/util/profile';

import { sqlserverEnabled, sqlserverOptions } from './test-utils';

import type { Schema } from '../../../src/types';

describe.skipIf(!sqlserverEnabled)('SQL Server integration', () => {
  const engines: SQLServerEngine[] = [];

  async function load(overrides: Partial<ReturnType<typeof sqlserverOptions>> = {}) {
    const engine = new SQLServerEngine({ model: 'unused' });
    engines.push(engine);
    await engine.load({ type: 'sqlserver', options: { ...sqlserverOptions(), ...overrides } });
    return engine;
  }

  afterEach(async () => {
    await Promise.all(engines.splice(0).map((engine) => engine.dispose()));
  });

  it('discovers schema-qualified tables, native types and keys', async () => {
    const schema = await (await load()).schema();
    expect(schema.models.map((model) => model.name)).toEqual(expect.arrayContaining([
      '[dbo].[customers]', '[dbo].[orders]', '[sales].[orders]',
    ]));
    const orders = schema.models.find((model) => model.name === '[dbo].[orders]')!;
    expect(orders.tableReference).toEqual({ catalog: sqlserverOptions().database, schema: 'dbo', table: 'orders' });
    expect(orders.primaryKey).toBe('order_id');
    expect(orders.columns).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'amount', type: 'decimal(12,2)', notNull: true }),
      expect.objectContaining({ name: 'order_date', type: 'date', notNull: true }),
    ]));
    expect(schema.models.find((model) => model.name === '[dbo].[customers]')!.columns).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'customer_name', type: 'nvarchar(100)', notNull: true }),
      expect.objectContaining({ name: 'region', type: 'nvarchar(50)', notNull: false }),
    ]));
    expect(schema.relationships).toEqual(expect.arrayContaining([
      expect.objectContaining({ models: ['[dbo].[orders]', '[dbo].[customers]'], joinType: 'MANY_TO_ONE' }),
    ]));
  });

  it('filters schema discovery and escapes the schema name', async () => {
    expect((await (await load({ schema: 'sales' })).schema()).models.map((model) => model.name)).toEqual(['[sales].[orders]']);
    expect((await (await load({ schema: "dbo'; DROP TABLE dbo.orders;--" })).schema()).models).toEqual([]);
  });

  it('returns Unicode, NULL, decimal and date values and describes empty results', async () => {
    const engine = await load();
    expect((await engine.execute('SELECT customer_name, region FROM dbo.customers WHERE customer_id=3')).data)
      .toEqual([{ customer_name: '李四', region: null }]);
    const row = (await engine.execute('SELECT order_date, amount FROM dbo.orders WHERE order_id=1001')).data[0];
    expect(row.amount).toBe(100.5);
    expect((row.order_date as Date).toISOString().slice(0, 10)).toBe('2025-01-05');
    expect(await engine.execute('SELECT CAST(NULL AS DECIMAL(12,2)) AS amount WHERE 1=0'))
      .toEqual({ data: [], schema: [{ name: 'amount', type: 'decimal' }], rowCount: 0 });
  });

  it('discovers, queries and profiles readable views', async () => {
    const engine = await load({ schema: 'dbo' });
    const schema = await engine.schema();
    const view = schema.models.find((model) => model.name === '[dbo].[paid_orders]')!;
    expect(view.tableReference).toEqual({ catalog: sqlserverOptions().database, schema: 'dbo', table: 'paid_orders' });
    expect(view.columns.map((column) => column.name)).toEqual(['order_id', 'customer_id', 'order_date', 'amount']);
    expect(view.primaryKey).toBeUndefined();
    expect(schema.relationships?.some((relationship) => relationship.models.includes(view.name))).toBe(false);
    const definition = schema.views!.find((item) => item.name === view.name)!;
    expect(definition.statement).not.toMatch(/^\s*(?:CREATE|ALTER)\b/i);
    expect((await engine.execute(definition.statement)).data).toHaveLength(5);
    expect((await engine.execute('SELECT COUNT(*) AS count, SUM(amount) AS total FROM dbo.paid_orders')).data).toEqual([
      { count: 5, total: 830.75 },
    ]);
    const profile = (await engine.profile({ models: [view] }, { metrics: ['row_count', 'sum', 'mean'] })).models[0];
    expect(profile.metrics).toEqual({ row_count: 5 });
    expect(profile.columns.find((column) => column.name === 'amount')!.metrics).toEqual({ sum: 830.75, mean: 166.15 });

    const aliased = await getSQLServerSchema(async () => [
      {
        kind: 'view',
        table_name: '[dbo].[report]',
        source_table: 'report',
        metadata: {
          sql: `CREATE OR ALTER VIEW dbo.report ([customer], [total]) WITH SCHEMABINDING, VIEW_METADATA AS
            WITH paid AS (
              SELECT customer_id, amount FROM dbo.orders WHERE status=N'paid' AND customer_id=2
            ) SELECT customer_id, amount FROM paid WITH CHECK OPTION;`,
        },
      },
    ]);
    const result = await engine.execute(aliased.views![0].statement);
    expect(result.data).toEqual(expect.arrayContaining([
      { customer: 2, total: 150.25 },
      { customer: 2, total: 300 },
    ]));
    expect(result.rowCount).toBe(2);
  });

  it('profiles fixture tables with the shared defaults', async () => {
    const engine = await load({ schema: 'dbo' });
    const schema = await engine.schema();
    const profile = await engine.profile(schema);
    const orders = profile.models.find((model) => model.name === '[dbo].[orders]')!;
    expect(orders.metrics).toEqual({ row_count: 6 });
    expect(orders.columns.find((column) => column.name === 'amount')!.metrics).toMatchObject({
      null_count: 0,
      distinct_count: 6,
      min: 50.75,
      max: 300,
    });
    expect(orders.columns.find((column) => column.name === 'amount')!.metrics.mean).toBeCloseTo(881.5 / 6);
    expect(orders.columns.find((column) => column.name === 'order_date')!.metrics).toMatchObject({
      min: Date.parse('2025-01-05T00:00:00Z'),
      max: Date.parse('2025-02-20T00:00:00Z'),
    });
    expect(orders.columns.find((column) => column.name === 'status')!.metrics.top_values).toEqual([
      { value: 'paid', count: 5 },
      { value: 'cancelled', count: 1 },
    ]);
    const customers = profile.models.find((model) => model.name === '[dbo].[customers]')!;
    expect(customers.columns.find((column) => column.name === 'customer_name')!.metrics).not.toHaveProperty('top_values');
  });

  it('profiles 819 integer columns without exceeding the SELECT limit', async () => {
    const engine = await load();
    const columns = Array.from({ length: 819 }, (_, i) => ({ name: `n${i}`, type: 'int' }));
    const schema: Schema = { models: [{ name: 'wide', tableReference: { table: 'wide' }, columns }] };
    const values = columns.map(({ name }, i) => `${i} AS [${name}]`).join(', ');
    const run = async (sql: string) => (await engine.execute(`WITH wide AS (SELECT ${values}) ${sql}`)).data;
    const profile = (await profileTables(run, schema, {
      metrics: DEFAULT_METRICS.map((id) => ({ id })),
    })).models[0];

    expect(profile.metrics).toEqual({ row_count: 1 });
    expect(profile.columns[818].metrics).toEqual({ null_count: 0, distinct_count: 1, min: 818, max: 818, mean: 818 });
  }, 30000);

  it('profiles empty, null, Unicode, boolean and date-offset values', async () => {
    const engine = await load();
    const schema: Schema = {
      models: [
        {
          name: 'samples',
          tableReference: { table: 'samples' },
          columns: [
            { name: 'n', type: 'int' },
            { name: 'label', type: 'nvarchar(20)' },
            { name: 'flag', type: 'bit' },
            { name: 'day', type: 'datetimeoffset(7)' },
          ],
        },
      ],
    };
    const metrics = BUILTIN_METRICS.map(({ id }) => ({ id, ...(id === 'top_values' ? { maxDistinctRatio: 1 } : {}) }));
    const samples = `SELECT CONVERT(int, n) AS n, CONVERT(nvarchar(20), label) AS label,
        CONVERT(bit, flag) AS flag, CONVERT(datetimeoffset, day) AS day
      FROM (VALUES
        (1, N'😀 ', 1, '2025-01-01T08:00:00+08:00'),
        (2, N'😀 ', 0, '2025-01-01T00:00:00+00:00'),
        (NULL, NULL, NULL, NULL)
      ) AS values_table(n, label, flag, day)`;
    const run =
      (where = '') =>
      async (sql: string) =>
        (await engine.execute(`WITH samples AS (${samples} ${where}) ${sql}`)).data;
    const profile = await profileTables(run(), schema, { metrics });
    expect(profile.models[0].metrics).toEqual({ row_count: 3 });
    const [numeric, text, boolean, date] = profile.models[0].columns;
    expect(numeric.metrics).toMatchObject({
      null_count: 1,
      distinct_count: 2,
      duplicate_count: 0,
      mean: 1.5,
      sum: 3,
      median: 1.5,
    });
    expect(numeric.metrics.stddev).toBeCloseTo(Math.SQRT1_2);
    expect(text.metrics).toMatchObject({
      null_count: 1,
      duplicate_count: 1,
      min_length: 2,
      max_length: 2,
      top_values: [{ value: '😀 ', count: 2 }],
    });
    expect(boolean.metrics.top_values).toEqual([
      { value: false, count: 1 },
      { value: true, count: 1 },
    ]);
    expect(date.metrics).toMatchObject({
      min: Date.parse('2025-01-01T00:00:00Z'),
      max: Date.parse('2025-01-01T00:00:00Z'),
    });

    const empty = run('WHERE 1=0');
    const emptyProfile = (await profileTables(empty, schema, { metrics })).models[0];
    expect(emptyProfile.metrics).toEqual({ row_count: 0 });
    expect(emptyProfile.columns[0].metrics).toEqual({
      null_count: 0,
      distinct_count: 0,
      duplicate_count: 0,
      min: null,
      max: null,
      mean: null,
      sum: null,
      stddev: null,
      median: null,
    });
    expect(emptyProfile.columns[1].metrics).toMatchObject({ min_length: null, max_length: null, top_values: [] });
    expect((await profileTables(empty, schema, { metrics: [{ id: 'median' }] })).models[0].columns[0].metrics).toEqual({
      median: null,
    });
    const allNull = (await profileTables(run('WHERE n IS NULL'), schema, { metrics })).models[0];
    expect(allNull.metrics).toEqual({ row_count: 1 });
    expect(allNull.columns[0].metrics).toEqual({ ...emptyProfile.columns[0].metrics, null_count: 1 });
    expect(allNull.columns[1].metrics).toMatchObject({
      null_count: 1,
      min_length: null,
      max_length: null,
      top_values: [],
    });
  });

  it('profiles legacy LOB and XML columns without importing rows', async () => {
    const engine = await load();
    const schema: Schema = {
      models: [
        {
          name: 'samples',
          tableReference: { table: 'samples' },
          columns: [
            { name: 'label', type: 'ntext' },
            { name: 'payload', type: 'image' },
            { name: 'doc', type: 'xml' },
          ],
        },
      ],
    };
    const run = async (sql: string) =>
      (
        await engine.execute(`WITH samples AS (
      SELECT CONVERT(ntext, label) AS label, CONVERT(image, payload) AS payload, CONVERT(xml, doc) AS doc
      FROM (VALUES (N'中文', 0x0102, N'<x/>'), (N'中文', 0x0102, N'<x/>'),
        (N'其他', 0x03, N'<X/>'), (NULL, NULL, NULL)) AS source(label, payload, doc)
    ) ${sql}`)
      ).data;
    const profile = (
      await profileTables(run, schema, {
        metrics: ['row_count', 'null_count', 'distinct_count', 'duplicate_count'].map((id) => ({ id })),
      })
    ).models[0];
    expect(profile.metrics).toEqual({ row_count: 4 });
    expect(profile.columns.map((column) => column.metrics)).toEqual([
      { null_count: 1, distinct_count: 2, duplicate_count: 1 },
      { null_count: 1, duplicate_count: 1 },
      { null_count: 1, duplicate_count: 1 },
    ]);
  });

  it('preserves integer averages and avoids integer sum overflow', async () => {
    const engine = await load();
    const schema: Schema = {
      models: [
        {
          name: 'samples',
          tableReference: { table: 'samples' },
          columns: [{ name: 'n', type: 'int' }],
        },
      ],
    };
    const run = async (sql: string) =>
      (
        await engine.execute(`WITH samples AS (
      SELECT n FROM (VALUES (2147483647), (2147483646), (NULL)) AS source(n)
    ) ${sql}`)
      ).data;
    expect(
      (await profileTables(run, schema, { metrics: [{ id: 'mean' }, { id: 'sum' }, { id: 'median' }] })).models[0]
        .columns[0].metrics
    ).toEqual({ mean: 2147483646.5, sum: 4294967293, median: 2147483646.5 });
  });

  it('bounds results without changing CTE and pagination semantics', async () => {
    const engine = await load();
    const query = 'WITH chosen AS (SELECT order_id FROM dbo.orders) SELECT order_id FROM chosen ORDER BY order_id OFFSET 1 ROWS FETCH NEXT 3 ROWS ONLY';
    const rows = await engine.execute(query, { maxRows: 2 });
    expect(rows.data).toEqual([{ order_id: 1002 }, { order_id: 1003 }]);
    expect(rows.truncatedBy).toBe('maxRows');
    expect(rows.rowCount).toBeUndefined();
    expect((await engine.execute('SELECT COUNT(*) AS count FROM dbo.orders')).data).toEqual([{ count: 6 }]);
  });

  it('refuses writes and recovers after query errors', async () => {
    const engine = await load();
    await expect(engine.execute('DELETE FROM dbo.orders')).rejects.toThrow('read-only SELECT');
    await expect(engine.execute('SELECT missing_column FROM dbo.orders')).rejects.toMatchObject({ code: 'EREQUEST' });
    expect((await engine.execute('SELECT COUNT(*) AS count FROM dbo.orders')).data).toEqual([{ count: 6 }]);
  });

  it('cancels timed-out queries and releases the pool', async () => {
    const engine = await load({ requestTimeoutMs: 50 });
    await expect(engine.execute('SELECT SUM(CONVERT(BIGINT,a.object_id) + b.object_id + c.object_id) AS value FROM sys.all_objects a CROSS JOIN sys.all_objects b CROSS JOIN sys.all_objects c'))
      .rejects.toMatchObject({ code: 'ETIMEOUT' });
    await engine.dispose();
    await expect(engine.execute('SELECT 1')).rejects.toThrow('No data loaded');
    expect((await (await load()).execute('SELECT 1 AS value')).data).toEqual([{ value: 1 }]);
  }, 15000);

  it('cleans up failed connections and permits reloading', async () => {
    const engine = new SQLServerEngine({ model: 'unused' });
    engines.push(engine);
    await expect(engine.load({ type: 'sqlserver', options: { ...sqlserverOptions(), password: 'incorrect-test-password' } }))
      .rejects.toMatchObject({ code: 'ELOGIN' });
    await expect(engine.schema()).rejects.toThrow('No data loaded');
    await engine.load({ type: 'sqlserver', options: sqlserverOptions() });
    expect((await engine.execute('SELECT 1 AS value')).data).toEqual([{ value: 1 }]);
  }, 15000);
});
