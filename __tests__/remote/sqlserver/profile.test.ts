import { describe, expect, it, vi } from 'vitest';

import { BUILTIN_METRICS, logicalType, profileTables } from '../../../src/remote/sqlserver/profile';

import type { Schema } from '../../../src/types';

const schema: Schema = {
  models: [
    {
      name: 'logical orders',
      tableReference: { catalog: 'test]db', schema: 'report]ing', table: 'order] rows' },
      columns: [
        { name: 'amount', type: 'decimal(12,2)' },
        { name: 'note]text', type: 'nvarchar(100)' },
        { name: 'enabled', type: 'bit' },
        { name: 'placed_at', type: 'datetimeoffset(7)' },
        { name: 'payload', type: 'xml' },
      ],
    },
  ],
};

const metricIds = [
  'row_count',
  'null_count',
  'distinct_count',
  'duplicate_count',
  'top_values',
  'min',
  'max',
  'min_length',
  'max_length',
  'mean',
  'sum',
  'stddev',
  'median',
];

function singleColumn(type: string): Schema {
  return {
    models: [
      { name: '[dbo].[data]', tableReference: { schema: 'dbo', table: 'data' }, columns: [{ name: 'value', type }] },
    ],
  };
}

describe('SQL Server profile', () => {
  it.each([
    {
      types: [
        'tinyint',
        'smallint',
        'int',
        'bigint',
        'decimal(12,2)',
        'numeric(18,4)',
        'money',
        'smallmoney',
        'real',
        'float',
      ],
      expected: 'numeric',
    },
    {
      types: ['char(10)', 'nchar(10)', 'varchar(100)', 'nvarchar(max)', 'text', 'ntext', 'uniqueidentifier'],
      expected: 'string',
    },
    { types: ['bit'], expected: 'boolean' },
    { types: ['date', 'smalldatetime', 'datetime', 'datetime2(7)', 'datetimeoffset(7)'], expected: 'date' },
    {
      types: [
        'binary(8)',
        'varbinary(max)',
        'image',
        'xml',
        'geography',
        'hierarchyid',
        'timestamp',
        'rowversion',
        'time(7)',
      ],
      expected: 'unknown',
    },
  ])('maps native $expected columns to their shared logical type', ({ types, expected }) => {
    for (const type of types) expect(logicalType(type)).toBe(expected);
  });

  it('exposes the same built-in metric set as the other remote engines', () => {
    expect(BUILTIN_METRICS.map(({ id }) => id).sort()).toEqual([...metricIds].sort());
  });

  it('batches metrics, keeps logical names and quotes each physical identifier', async () => {
    const run = vi.fn<(sql: string) => Promise<Record<string, unknown>[]>>().mockResolvedValue([
      {
        m0: '6',
        m1: '1',
        m2: '12.5',
        m3: 20,
        m4: 0,
        m5: '[{"value":"中文","count":2}]',
        m6: 0,
        m7: '[{"value":true,"count":4},{"value":false,"count":2}]',
        m8: 1,
        m9: '1709283600000',
        m10: 2,
      },
    ]);

    const result = await profileTables(run, schema, {
      metrics: [{ id: 'row_count' }, { id: 'null_count' }, { id: 'mean' }, { id: 'top_values' }, { id: 'max' }],
    });

    expect(result).toEqual({
      models: [
        {
          name: 'logical orders',
          metrics: { row_count: 6 },
          columns: [
            { name: 'amount', properties: { logicalType: 'numeric' }, metrics: { null_count: 1, mean: 12.5, max: 20 } },
            {
              name: 'note]text',
              properties: { logicalType: 'string' },
              metrics: { null_count: 0, top_values: [{ value: '中文', count: 2 }] },
            },
            {
              name: 'enabled',
              properties: { logicalType: 'boolean' },
              metrics: {
                null_count: 0,
                top_values: [
                  { value: true, count: 4 },
                  { value: false, count: 2 },
                ],
              },
            },
            { name: 'placed_at', properties: { logicalType: 'date' }, metrics: { null_count: 1, max: 1709283600000 } },
            { name: 'payload', properties: { logicalType: 'unknown' }, metrics: { null_count: 2 } },
          ],
        },
      ],
    });
    expect(run).toHaveBeenCalledTimes(1);
    const query = run.mock.calls[0][0];
    expect(query).toContain('[test]]db].[report]]ing].[order]] rows]');
    expect(query).toContain('[note]]text]');
    expect(query).not.toContain('[logical orders]');
    expect(query).toMatch(/FOR JSON PATH/i);
  });

  it('preserves zero counts and null numeric aggregates for an empty table', async () => {
    const run = vi
      .fn()
      .mockResolvedValue([{ m0: 0, m1: 0, m2: 0, m3: 0, m4: null, m5: null, m6: null, m7: null, m8: null, m9: null }]);
    const result = await profileTables(run, singleColumn('decimal(12,2)'), {
      metrics: metricIds.map((id) => ({ id })),
    });
    expect(result.models[0].metrics).toEqual({ row_count: 0 });
    expect(result.models[0].columns[0].metrics).toEqual({
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
  });

  it('normalizes non-finite numeric results to null', async () => {
    const run = vi.fn().mockResolvedValue([{ m0: 'NaN', m1: Infinity }]);
    const result = await profileTables(run, singleColumn('float'), { metrics: [{ id: 'mean' }, { id: 'stddev' }] });
    expect(result.models[0].columns[0].metrics).toEqual({ mean: null, stddev: null });
  });

  it('computes only counts for unsupported native types', async () => {
    const run = vi.fn().mockResolvedValue([{ m0: 4, m1: 1, m2: 2 }]);
    const result = await profileTables(run, singleColumn('xml'), { metrics: metricIds.map((id) => ({ id })) });
    expect(result.models[0].metrics).toEqual({ row_count: 4 });
    expect(result.models[0].columns[0]).toEqual({
      name: 'value',
      properties: { logicalType: 'unknown' },
      metrics: { null_count: 1, duplicate_count: 2 },
    });
  });

  it('passes top-values options to the ranked JSON query', async () => {
    const run = vi.fn().mockResolvedValue([{ m0: '[{"value":"A","count":3}]' }]);
    const result = await profileTables(run, singleColumn('nvarchar(20)'), {
      metrics: [{ id: 'top_values', limit: 1, maxDistinctRatio: 0.75 }],
    });
    expect(result.models[0].columns[0].metrics).toEqual({ top_values: [{ value: 'A', count: 3 }] });
    expect(run.mock.calls[0][0]).toMatch(/TOP\s*(?:\(\s*1\s*\)|1\b)/i);
    expect(run.mock.calls[0][0]).toContain('0.75');
    expect(run.mock.calls[0][0]).toMatch(/FOR JSON PATH/i);
  });

  it.each([
    { raw: null, metrics: {} },
    { raw: '[]', metrics: { top_values: [] } },
  ])('distinguishes omitted top values from an empty result: $raw', async ({ raw, metrics }) => {
    const run = vi.fn().mockResolvedValue([{ m0: raw }]);
    const result = await profileTables(run, singleColumn('nvarchar(20)'), { metrics: [{ id: 'top_values' }] });
    expect(result.models[0].columns[0].metrics).toEqual(metrics);
  });

  it('keeps the structure and logical types without querying for an empty selection', async () => {
    const run = vi.fn();
    const result = await profileTables(run, schema, { metrics: [] });
    expect(result).toEqual({
      models: [
        {
          name: 'logical orders',
          metrics: {},
          columns: [
            { name: 'amount', properties: { logicalType: 'numeric' }, metrics: {} },
            { name: 'note]text', properties: { logicalType: 'string' }, metrics: {} },
            { name: 'enabled', properties: { logicalType: 'boolean' }, metrics: {} },
            { name: 'placed_at', properties: { logicalType: 'date' }, metrics: {} },
            { name: 'payload', properties: { logicalType: 'unknown' }, metrics: {} },
          ],
        },
      ],
    });
    expect(run).not.toHaveBeenCalled();
  });

  it('issues one aggregate query per table', async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce([{ m0: 2 }])
      .mockResolvedValueOnce([{ m0: 5 }]);
    const result = await profileTables(
      run,
      {
        models: [
          { name: 'customers', tableReference: { schema: 'dbo', table: 'customers' }, columns: [] },
          { name: 'orders', tableReference: { schema: 'sales', table: 'orders' }, columns: [] },
        ],
      },
      { metrics: [{ id: 'row_count' }] }
    );
    expect(run).toHaveBeenCalledTimes(2);
    expect(result.models.map(({ name, metrics }) => ({ name, metrics }))).toEqual([
      { name: 'customers', metrics: { row_count: 2 } },
      { name: 'orders', metrics: { row_count: 5 } },
    ]);
    expect(run.mock.calls[0][0]).toContain('[dbo].[customers]');
    expect(run.mock.calls[1][0]).toContain('[sales].[orders]');
  });

  it.each([
    { metric: { id: 'missing' }, error: 'Unknown metric' },
    { metric: { id: 'row_count', limit: 2 }, error: 'Unknown option' },
    { metric: { id: 'top_values', limit: -1 }, error: 'top_values.limit' },
    { metric: { id: 'top_values', maxDistinctRatio: 2 }, error: 'top_values.maxDistinctRatio' },
  ])('rejects invalid metric configuration before querying: $error', async ({ metric, error }) => {
    const run = vi.fn();
    await expect(profileTables(run, schema, { metrics: [metric] })).rejects.toThrow(error);
    expect(run).not.toHaveBeenCalled();
  });

  it('propagates query failures without returning a partial profile', async () => {
    const error = new Error('query failed');
    const run = vi.fn().mockRejectedValue(error);
    await expect(profileTables(run, schema, { metrics: [{ id: 'row_count' }] })).rejects.toBe(error);
  });
});
