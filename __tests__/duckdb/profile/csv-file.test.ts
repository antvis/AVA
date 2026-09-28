import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';
import { OFFLINE_LLM } from '../test-utils';

describe('profile/csv-file', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('profiles a loaded CSV file through the engine', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'csv-file',
      options: { path: path.join(__dirname, '../../datasets/sales.csv') },
    });

    const profile = await engine.profile({
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
    await expect(engine.profile({ metrics: ['custom_metric'] })).rejects.toThrow('Unknown metric: custom_metric');
  });
});

// Profile metrics use JavaScript numbers and epoch milliseconds. Unsupported
// logical types omit min/max rather than inventing values or string ranges.
describe('profile/csv-file metric formats and boundaries', () => {
  let engine: DuckDBEngine;
  let directory: string;
  let csvPath: string;
  beforeEach(async () => {
    engine = new DuckDBEngine(OFFLINE_LLM);
    directory = await mkdtemp(path.join(tmpdir(), 'ava-csv-test-'));
    csvPath = path.join(directory, 'source.csv');
  });
  afterEach(async () => {
    try {
      await engine?.dispose();
    } finally {
      if (directory) await rm(directory, { recursive: true, force: true });
    }
  });

  it.each([
    {
      type: 'BIGINT',
      min: '9007199254740990',
      max: '9007199254740991',
      expected: { min: 9007199254740990, max: Number.MAX_SAFE_INTEGER },
    },
    { type: 'DECIMAL(12,3)', min: '12345.125', max: '12345.875', expected: { min: 12345.125, max: 12345.875 } },
    {
      type: 'DATE',
      min: '2026-09-27',
      max: '2026-09-28',
      expected: { min: Date.UTC(2026, 8, 27), max: Date.UTC(2026, 8, 28) },
    },
    {
      type: 'TIMESTAMP',
      min: '2026-09-28 12:34:56.123456',
      max: '2026-09-28 12:34:56.124456',
      expected: { min: Date.UTC(2026, 8, 28, 12, 34, 56, 123), max: Date.UTC(2026, 8, 28, 12, 34, 56, 124) },
    },
    {
      type: 'TIMESTAMP_NS',
      min: '2026-09-28 12:34:56.123456789',
      max: '2026-09-28 12:34:56.124456789',
      expected: { min: Date.UTC(2026, 8, 28, 12, 34, 56, 123), max: Date.UTC(2026, 8, 28, 12, 34, 56, 124) },
    },
    { type: 'DATE', min: '-infinity', max: 'infinity', expected: { min: null, max: null } },
  ])('returns numeric/epoch-ms extrema for $type', async ({ type, min, max, expected }) => {
    await writeFile(csvPath, `value\n${min}\n${max}\n`);
    await engine.load({
      type: 'csv-file',
      options: { path: csvPath, options: { header: true, columns: { value: type } } },
    });
    const profile = await engine.profile({ metrics: ['min', 'max'] });
    expect(profile.tables[0].fields[0].metrics).toEqual(expected);
  });

  it('omits unsupported range metrics for TIME while retaining native metadata', async () => {
    await writeFile(csvPath, 'value\n12:34:56.123456\n12:34:56.123457\n');
    await engine.load({
      type: 'csv-file',
      options: { path: csvPath, options: { header: true, columns: { value: 'TIME' } } },
    });
    const profile = await engine.profile({ metrics: ['min', 'max'] });
    expect(profile.tables[0].fields[0]).toMatchObject({ type: 'TIME', logicalType: 'unknown', metrics: {} });
  });

  it.each([1, 3, 20, 21])('supplies all classification candidates and distinct count at boundary %i', async (count) => {
    const values = Array.from({ length: count }, (_, i) => `category-${i}`);
    await writeFile(csvPath, `category\n${values.join('\n')}\n`);
    await engine.load({ type: 'csv-file', options: { path: csvPath, options: { header: true, all_varchar: true } } });
    const profile = await engine.profile({
      metrics: ['row_count', 'distinct_count', { id: 'top_values', limit: 20, maxDistinctRatio: 1 }],
    });
    const { metrics } = profile.tables[0].fields[0];
    expect(profile.tables[0].metrics.row_count).toBe(count);
    expect(metrics.distinct_count).toBe(count);
    expect(metrics.top_values).toEqual(
      values
        .sort()
        .slice(0, 20)
        .map((value) => ({ value, count: 1 }))
    );
    // At count=21 the Top20 list is not the complete category domain. The
    // distinct count must remain available to detect the incomplete list.
  });

  it('distinguishes a zero-row table from an all-NULL category column', async () => {
    await writeFile(csvPath, 'category\nNULL\nNULL\n');
    await engine.load({
      type: 'csv-file',
      options: {
        path: csvPath,
        options: {
          header: true,
          columns: { category: 'VARCHAR' },
          nullstr: ['NULL'],
        },
      },
    });
    const profile = await engine.profile({
      metrics: ['row_count', 'null_count', 'distinct_count', { id: 'top_values', limit: 20, maxDistinctRatio: 1 }],
    });
    expect(profile.tables[0].metrics).toEqual({ row_count: 2 });
    expect(profile.tables[0].fields[0].metrics).toEqual({ null_count: 2, distinct_count: 0, top_values: [] });
  });

  it('excludes floating non-finite values and reports null when none are finite', async () => {
    await writeFile(csvPath, 'value\nNaN\nInfinity\n-Infinity\n');
    await engine.load({
      type: 'csv-file',
      options: { path: csvPath, options: { header: true, columns: { value: 'DOUBLE' } } },
    });
    const profile = await engine.profile({ metrics: ['min', 'max'] });
    expect(profile.tables[0].fields[0].metrics).toEqual({ min: null, max: null });
  });

  it.each(['BIGINT', 'TIMESTAMP'])('keeps explicit null extrema for an all-NULL %s column', async (type) => {
    await writeFile(csvPath, 'value\nNULL\n');
    await engine.load({
      type: 'csv-file',
      options: { path: csvPath, options: { header: true, columns: { value: type }, nullstr: ['NULL'] } },
    });
    const profile = await engine.profile({ metrics: ['min', 'max'] });
    expect(profile.tables[0].fields[0].metrics).toEqual({ min: null, max: null });
  });

  it('retains engine-reported nullability for CSV fields', async () => {
    await writeFile(csvPath, 'name\nAlice\n');
    const schema = await engine.load({ type: 'csv-file', options: { path: csvPath, options: { header: true } } });
    expect(schema.tables[0].fields[0].nullable).toBe(true);
  });
});
