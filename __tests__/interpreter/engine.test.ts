/**
 * Unit tests for src/interpreter/engine.ts
 */

import { describe, it, expect, afterEach } from 'vitest';

import { AVA } from '../../src';
import { BUILTIN_METRICS, profileTables as memoryProfile } from '../../src/interpreter/profile';
import { InterpreterEngine } from '../../src/interpreter/engine';
import { getLLMConfig, skipLLMTests } from '../test-utils';

import type { Schema } from '../../src/types';

describe('interpreter/engine', () => {
  let engine: InterpreterEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads a json source and returns its schema', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    const schema = await engine.load({ type: 'json', options: { data: [{ name: 'Alice', age: 30 }] } });

    expect(schema.tables).toHaveLength(1);
    expect(schema.tables[0].name).toBe('data');
    expect(schema.tables[0]).toEqual({
      name: 'data',
      columnCount: 2,
      fields: [
        { name: 'name', type: 'string' },
        { name: 'age', type: 'number' },
      ],
      indexes: [],
    });
  });

  it('rejects unsupported source types', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    await expect(engine.load({ type: 'mysql', options: {} } as any)).rejects.toThrow(
      'InterpreterEngine only supports csv/json/text sources'
    );
  });

  it('executes JavaScript code against the loaded data', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    await engine.load({ type: 'json', options: { data: [{ value: 10 }, { value: 20 }] } });

    const result = await engine.execute('const result = stat.sum(data, "value");');
    expect(result.data).toEqual([{ value: 30 }]);
  });

  it('returns a bounded result', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    await engine.load({ type: 'json', options: { data: [{ value: 10 }, { value: 20 }] } });

    const result = await engine.execute('const result = data;', { maxRows: 1 });
    expect(result.data).toEqual([{ value: 10 }]);
    expect(result.truncated).toBe(true);
  });

  it('throws when executing without loading data', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    await expect(engine.execute('const result = 1;')).rejects.toThrow('No data loaded');
  });

  it.skipIf(skipLLMTests)('generates JavaScript code from a natural-language query', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    await engine.load({ type: 'json', options: { data: [{ value: 10 }, { value: 20 }] } });

    const code = await engine.getDSL('sum of value');
    const result = await engine.execute(code);
    expect(result.data).toEqual([{ value: 30 }]);
  });

  describe('profile', () => {
    const metrics = BUILTIN_METRICS.map(({ id }) => ({ id }));

    it('computes the DuckDB metrics through AVA, without changing schema or rows', async () => {
      const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'interpreter' } });
      const data = [
        { n: 1, category: 'B', flag: true, day: '2024-01-01' },
        { n: 3, category: 'A', flag: false, day: '2024-01-03' },
        { n: 3, category: 'A', flag: false, day: null },
        { n: null, category: null, flag: null, day: null },
      ];
      try {
        const loaded = await ava.load({ type: 'json', options: { data } });
        const before = JSON.stringify({ loaded, data });
        const result = await ava.profile({ metrics });
        const [table] = result.tables;
        expect(result.generatedAt).toEqual(expect.any(Number));
        expect(table.metrics).toEqual({ row_count: 4 });
        expect(table.fields[0].metrics).toMatchObject({
          null_count: 1,
          distinct_count: 2,
          duplicate_count: 1,
          min: 1,
          max: 3,
          sum: 7,
          median: 3,
        });
        expect(table.fields[0].metrics.mean).toBeCloseTo(7 / 3);
        expect(table.fields[0].metrics.stddev).toBeCloseTo(Math.sqrt(4 / 3));
        expect(table.fields[1].metrics.top_values).toEqual([
          { value: 'A', count: 2 },
          { value: 'B', count: 1 },
        ]);
        expect(table.fields[2]).toMatchObject({
          logicalType: 'boolean',
          metrics: {
            top_values: [
              { value: false, count: 2 },
              { value: true, count: 1 },
            ],
          },
        });
        expect(table.fields[3].metrics).toMatchObject({ min: Date.UTC(2024, 0, 1), max: Date.UTC(2024, 0, 3) });
        expect(JSON.stringify({ loaded, data })).toBe(before);
        expect((await ava.profile()).tables[0].fields[0].metrics).not.toHaveProperty('sum');
        expect(
          (await ava.profile({ metrics: [] })).tables[0].fields.every((field) => !Object.keys(field.metrics).length)
        ).toBe(true);
        expect(
          (await ava.profile({ metrics: [{ id: 'top_values', limit: 0 }] })).tables[0].fields[1].metrics.top_values
        ).toEqual([]);
        expect(
          (await ava.profile({ metrics: [{ id: 'top_values', maxDistinctRatio: 0 }] })).tables[0].fields[1].metrics
        ).toEqual({});
      } finally {
        await ava.dispose();
      }
    });

    it('handles empty, non-finite, singleton and Unicode values', () => {
      const local: Schema = {
        tables: [
          {
            name: 'data',
            columnCount: 2,
            indexes: [],
            fields: [
              { name: 'n', type: 'number' },
              { name: 's', type: 'string' },
            ],
          },
        ],
      };
      const empty = memoryProfile([], local, { metrics }).tables[0];
      expect(empty.metrics.row_count).toBe(0);
      expect(empty.fields[0].metrics).toMatchObject({
        null_count: 0,
        distinct_count: 0,
        sum: null,
        median: null,
        stddev: null,
      });
      expect(empty.fields[1].metrics.top_values).toEqual([]);
      const result = memoryProfile(
        [
          { n: Infinity, s: '😀' },
          { n: NaN, s: '😀' },
          { n: 2, s: null },
        ],
        local,
        { metrics }
      ).tables[0];
      expect(result.fields[0].metrics).toMatchObject({ null_count: 0, min: 2, max: 2, mean: 2, stddev: null });
      expect(result.fields[1].metrics).toMatchObject({ min_length: 1, max_length: 1 });
      expect(memoryProfile([{ s: 2 }, { s: '2' }], local, { metrics }).tables[0].fields[1].metrics.top_values).toEqual([
        { value: '2', count: 2 },
      ]);
      expect(memoryProfile([{ n: 2 }, { n: 4 }], local, { metrics }).tables[0].fields[0].metrics.median).toBe(3);
    });

    it('rejects unloaded/disposed/failed loads and invalid options', async () => {
      engine = new InterpreterEngine(getLLMConfig());
      const config = { type: 'json' as const, options: { data: [] } };
      await expect(engine.profile()).rejects.toThrow('No data loaded');
      await engine.load(config);
      for (const limit of [NaN, null, false, '2', -1, 1.5, Infinity]) {
        await expect(engine.profile({ metrics: [{ id: 'top_values', limit }] })).rejects.toThrow('top_values.limit');
      }
      await expect(engine.profile({ metrics: ['missing'] })).rejects.toThrow('Unknown metric');
      await expect(engine.profile({ metrics: [{ id: 'row_count', limit: 2 }] })).rejects.toThrow('Unknown option');
      await engine.dispose();
      await expect(engine.profile()).rejects.toThrow('No data loaded');
      await engine.load(config);
      await expect(engine.load({ type: 'csv-file', options: { path: 'unused' } })).rejects.toThrow('only supports');
      await expect(engine.profile()).rejects.toThrow('No data loaded');
    });
  });
});
