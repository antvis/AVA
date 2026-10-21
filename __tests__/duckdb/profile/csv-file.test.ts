import * as path from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('profile/csv-file', () => {
  let engine: DuckDBEngine | null = null;

  beforeEach(async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'csv-file', options: { path: path.join(__dirname, '../../datasets/sales.csv') } });
  });

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('profiles selected numeric, string and date columns from a CSV file', async () => {
    const schema = await engine.schema();
    const model = schema.models[0];
    model.columns = ['region', 'quantity', 'order_date', 'order_id'].map(
      (name) => model.columns.find((column) => column.name === name)!
    );
    const profile = await engine.profile(schema, {
      metrics: [
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
      ],
    });
    expect(profile).toEqual({
      models: [
        {
          name: 'data',
          metrics: { row_count: 240 },
          columns: [
            {
              name: 'region',
              properties: { logicalType: 'string' },
              metrics: {
                null_count: 1,
                distinct_count: 4,
                duplicate_count: 235,
                min_length: 4,
                max_length: 5,
                top_values: [
                  { value: 'North', count: 60 },
                  { value: 'South', count: 60 },
                  { value: 'West', count: 60 },
                ],
              },
            },
            {
              name: 'quantity',
              properties: { logicalType: 'numeric' },
              metrics: {
                null_count: 1,
                distinct_count: 15,
                duplicate_count: 224,
                min: 1,
                max: 15,
                sum: 1814,
                median: 7,
                mean: expect.closeTo(1814 / 239, 10),
                // Non-null quantities have sum 1814 and sum of squares 18380.
                stddev: expect.closeTo(Math.sqrt((18380 - 1814 ** 2 / 239) / 238), 10),
              },
            },
            {
              name: 'order_date',
              properties: { logicalType: 'date' },
              metrics: {
                null_count: 0,
                distinct_count: 240,
                duplicate_count: 0,
                min: Date.UTC(2025, 0, 1),
                max: Date.UTC(2025, 11, 31),
              },
            },
            {
              name: 'order_id',
              properties: { logicalType: 'string' },
              metrics: { null_count: 0, distinct_count: 240, duplicate_count: 0, min_length: 8, max_length: 8 },
            },
          ],
        },
      ],
    });
  });

  it('uses the last configuration when a metric is requested more than once', async () => {
    const repeated = await engine.profile(await engine.schema(), {
      metrics: [
        { id: 'top_values', maxDistinctRatio: 1 },
        { id: 'top_values', maxDistinctRatio: 0 },
      ],
    });
    expect(repeated.models[0].columns.find(({ name }) => name === 'region')!.metrics).toEqual({});
  });
});
