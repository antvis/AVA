import { describe, expect, it, vi } from 'vitest';

import { BUILTIN_METRICS, profileTables } from '../../../src/remote/bigquery/profile';

import type { Schema } from '../../../src/types';

const SCHEMA: Schema = {
  models: [
    {
      name: 'order notes',
      tableReference: { catalog: 'bigquery-public-data', schema: 'shop', table: 'order notes' },
      columns: [
        { name: 'amount', type: 'NUMERIC(10, 2)' },
        { name: 'note`text', type: 'STRING' },
        { name: 'placed_at', type: 'TIMESTAMP' },
        { name: 'placed_on', type: 'DATE' },
        { name: 'tags', type: 'ARRAY<STRING>' },
      ],
    },
  ],
};

describe('BigQuery profiling', () => {
  it('profiles a table with one GoogleSQL query and quotes every identifier', async () => {
    // Results are named m0, m1, ... in table, column and metric order.
    const run = vi.fn<(sql: string) => Promise<Record<string, unknown>[]>>().mockResolvedValue([
      {
        m0: 4,
        m1: 25,
        m2: 35.5,
        m3: 0,
        m4: '[{"value":"gift wrap","count":2}]',
        m5: 1,
        m6: 1709283600000,
        m7: 0,
        m8: 1704844800000,
        m9: 1,
        m10: 0,
      },
    ]);

    const result = await profileTables(run, SCHEMA, {
      metrics: [{ id: 'row_count' }, { id: 'mean' }, { id: 'top_values' }, { id: 'max' }, { id: 'duplicate_count' }],
    });

    expect(run).toHaveBeenCalledOnce();
    const sql = run.mock.calls[0][0];
    expect(sql).toContain('FROM `bigquery-public-data`.`shop`.`order notes`');
    expect(sql).toContain('`note\\`text`');
    expect(sql).toContain('AVG(IF(IS_NAN(CAST(`amount` AS FLOAT64)) OR IS_INF(CAST(`amount` AS FLOAT64)), NULL,');
    expect(sql).toContain('UNIX_MILLIS(MAX(`placed_at`))');
    expect(sql).toContain('UNIX_MILLIS(TIMESTAMP(MAX(`placed_on`)))');
    expect(sql).toContain('COUNT(DISTINCT IF(`tags` IS NULL, NULL, TO_JSON_STRING(`tags`)))');
    expect(sql).not.toMatch(/"[a-z ]+"\.|"amount"/);
    expect(result.models[0]).toMatchObject({
      name: 'order notes',
      metrics: { row_count: 4 },
      columns: [
        {
          name: 'amount',
          properties: { logicalType: 'numeric' },
          metrics: { mean: 25, max: 35.5, duplicate_count: 0 },
        },
        {
          name: 'note`text',
          properties: { logicalType: 'string' },
          metrics: { top_values: [{ value: 'gift wrap', count: 2 }], duplicate_count: 1 },
        },
        { name: 'placed_at', properties: { logicalType: 'date' }, metrics: { max: 1709283600000, duplicate_count: 0 } },
        { name: 'placed_on', properties: { logicalType: 'date' }, metrics: { max: 1704844800000, duplicate_count: 1 } },
        { name: 'tags', properties: { logicalType: 'unknown' }, metrics: { duplicate_count: 0 } },
      ],
    });
  });

  it('distinguishes omitted, empty and malformed top values', async () => {
    const schema: Schema = {
      models: [{ name: 'data', tableReference: { table: 'data' }, columns: [{ name: 'value', type: 'STRING' }] }],
    };
    const profile = async (raw: unknown) =>
      (await profileTables(vi.fn().mockResolvedValue([{ m0: raw }]), schema, { metrics: [{ id: 'top_values' }] }))
        .models[0].columns[0].metrics;

    await expect(profile(null)).resolves.toEqual({});
    await expect(profile('[]')).resolves.toEqual({ top_values: [] });
    await expect(profile('null')).resolves.toEqual({ top_values: [] });
    await expect(profile('{"value":"A"}')).rejects.toThrow('Invalid BigQuery top_values result');
    await expect(profile('[{"value":"A","count":"x"}]')).rejects.toThrow('Invalid BigQuery top_values entry');
  });

  it('resolves bare model names against the default dataset and maps non-finite results to null', async () => {
    const run = vi.fn().mockResolvedValue([{ m0: 'NaN' }]);
    const result = await profileTables(
      run,
      {
        models: [
          { name: 'orders', tableReference: { table: 'orders' }, columns: [{ name: 'amount', type: 'FLOAT64' }] },
        ],
      },
      { metrics: [{ id: 'median' }] }
    );
    expect(run.mock.calls[0][0]).toContain('PERCENTILE_CONT(');
    expect(run.mock.calls[0][0]).toContain('FROM `orders` LIMIT 1)');
    expect(result.models[0].columns[0].metrics).toEqual({ median: null });
  });

  it('implements the same metric ids as the other engines', () => {
    expect(BUILTIN_METRICS.map(({ id }) => id)).toEqual([
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
    ]);
  });
});
