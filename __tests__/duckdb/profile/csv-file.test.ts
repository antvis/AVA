import * as path from 'path';

import { afterEach, describe, expect, it } from 'vitest';

import { AVA } from '../../../src';
import { getLLMConfig } from '../../test-utils';

describe('profile/csv-file', () => {
  let ava: AVA | null = null;

  afterEach(async () => {
    await ava?.dispose();
    ava = null;
  });

  it('profiles a loaded CSV file through the public API', async () => {
    ava = new AVA({ llm: getLLMConfig() });
    await ava.load({
      type: 'csv-file',
      options: { path: path.join(__dirname, '../../datasets/sales.csv') },
    });

    const profile = await ava.profile({
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
    const table = profile.tables[0];

    expect(profile.generatedAt).toEqual(expect.any(Number));
    expect(table).toMatchObject({
      name: 'data',
      columnCount: 12,
      metrics: { row_count: 240 },
    });
    expect(table.fields.find(({ name }) => name === 'region')).toMatchObject({
      type: 'VARCHAR',
      logicalType: 'string',
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
    });
    const quantity = table.fields.find(({ name }) => name === 'quantity')!;
    expect(quantity).toMatchObject({
      type: 'BIGINT',
      logicalType: 'numeric',
      metrics: {
        null_count: 1,
        distinct_count: 15,
        duplicate_count: 224,
        min: 1,
        max: 15,
        sum: 1814,
        median: 7,
      },
    });
    expect(quantity.metrics.mean).toBeCloseTo(1814 / 239, 10);
    // The non-null quantities have sum 1814 and sum of squares 18380.
    expect(quantity.metrics.stddev).toBeCloseTo(Math.sqrt((18380 - 1814 ** 2 / 239) / 238), 10);
    expect(quantity.metrics).not.toHaveProperty('top_values');
    expect(table.fields.find(({ name }) => name === 'order_id')!.metrics).not.toHaveProperty('top_values');
    expect(table.fields.find(({ name }) => name === 'order_date')).toMatchObject({
      type: 'DATE',
      logicalType: 'date',
      metrics: {
        min: Date.UTC(2025, 0, 1),
        max: Date.UTC(2025, 11, 31),
      },
    });
  });
});
