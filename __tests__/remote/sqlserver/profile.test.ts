import { describe, expect, it, vi } from 'vitest';

import { profileTables } from '../../../src/remote/sqlserver/profile';
import { DEFAULT_METRICS } from '../../../src/util/profile';

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

describe('SQL Server profile', () => {
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
      metrics: [
        { id: 'row_count' },
        { id: 'null_count' },
        { id: 'mean' },
        { id: 'top_values', limit: 2, maxDistinctRatio: 0.75 },
        { id: 'max' },
      ],
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
    expect(query).toContain('TOP (2)');
    expect(query).toContain('COUNT_BIG(*) * 0.75');
    expect(query).toContain('FOR JSON PATH');
  });

  it('splits wide-table metrics within the SELECT limit and preserves output mappings', async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce([{ m0: 3, m4091: 1, m4092: 2, m4093: 10, m4094: 20 }])
      .mockResolvedValueOnce([{ m0: 15 }]);
    const schema: Schema = {
      models: [
        {
          name: 'wide',
          tableReference: { table: 'wide' },
          columns: Array.from({ length: 819 }, (_, i) => ({ name: `n${i}`, type: 'int' })),
        },
      ],
    };
    const result = await profileTables(run, schema, { metrics: DEFAULT_METRICS.map((id) => ({ id })) });

    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls.map(([query]) => [...query.matchAll(/ AS \[m\d+\]/g)].length)).toEqual([4095, 1]);
    expect(result.models[0].metrics).toEqual({ row_count: 3 });
    expect(result.models[0].columns[818]).toMatchObject({
      name: 'n818',
      metrics: { null_count: 1, distinct_count: 2, min: 10, max: 20, mean: 15 },
    });
  });

  it('keeps the profile structure without querying for an empty metric selection', async () => {
    const run = vi.fn();
    const result = await profileTables(run, schema, { metrics: [] });

    expect(result.models[0].name).toBe('logical orders');
    expect(result.models[0].metrics).toEqual({});
    expect(result.models[0].columns.map(({ name }) => name)).toEqual(schema.models[0].columns.map(({ name }) => name));
    for (const column of result.models[0].columns) expect(column.metrics).toEqual({});
    expect(run).not.toHaveBeenCalled();
  });
});
