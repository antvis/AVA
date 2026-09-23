/**
 * Unit tests for src/interpreter/engine.ts
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { AVA } from '../../src';
import { BUILTIN_METRICS, profileTables as memoryProfile } from '../../src/interpreter/profile';
import { InterpreterEngine } from '../../src/interpreter/engine';
import { getLLMConfig } from '../test-utils';

import type { Schema } from '../../src/types';

describe('interpreter/engine', () => {
  let engine: InterpreterEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads data and executes JavaScript with bounded results', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    await expect(engine.execute('const result = 1;')).rejects.toThrow('No data loaded');
    const schema = await engine.load({ type: 'json', options: { data: [{ value: 10 }, { value: 20 }] } });
    expect(schema.tables[0].fields).toEqual([{ name: 'value', type: 'number' }]);
    expect((await engine.execute('const result = stat.sum(data, "value");')).data).toEqual([{ value: 30 }]);
    const result = await engine.execute('const result = data;', { maxRows: 1 });
    expect(result.data).toEqual([{ value: 10 }]);
    expect(result.truncated).toBe(true);
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

    it('builds only the intermediates requested by metrics and reuses them within a field', () => {
      const local: Schema = {
        tables: [{ name: 'data', columnCount: 1, indexes: [], fields: [{ name: 'n', type: 'number' }] }],
      };
      let reads = 0;
      const data = [1, 3].map((n) => ({
        get n() {
          reads += 1;
          return n;
        },
      }));
      const set = vi.spyOn(Map.prototype, 'set');
      try {
        const result = memoryProfile(data, local, { metrics: ['min', 'max', 'mean'].map((id) => ({ id })) });
        expect(result.tables[0].fields[0].metrics).toEqual({ min: 1, max: 3, mean: 2 });
        expect(reads).toBe(2);
        expect(set).not.toHaveBeenCalled();
        const counts = memoryProfile(data, local, {
          metrics: ['distinct_count', 'duplicate_count'].map((id) => ({ id })),
        });
        expect(counts.tables[0].fields[0].metrics).toEqual({ distinct_count: 2, duplicate_count: 0 });
        expect(reads).toBe(4);
        expect(set).toHaveBeenCalledTimes(2);
      } finally {
        set.mockRestore();
      }

      const circular: Record<string, unknown> = {};
      circular.self = circular;
      local.tables[0].fields[0].type = 'unknown';
      expect(
        memoryProfile([{ n: circular }, { n: null }], local, { metrics: [{ id: 'null_count' }] }).tables[0].fields[0]
          .metrics
      ).toEqual({ null_count: 1 });
    });

    it('rejects unloaded/disposed/failed loads and invalid options', async () => {
      engine = new InterpreterEngine(getLLMConfig());
      const config = { type: 'json' as const, options: { data: [] } };
      await expect(engine.profile()).rejects.toThrow('No data loaded');
      await engine.load(config);
      for (const limit of [NaN, -1]) {
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
