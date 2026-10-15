import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@clickhouse/client';

import { AVA } from '../src';
import { DuckDBEngine } from '../src/duckdb';
import { JavaScriptEngine } from '../src/interpreter/javascript';
import { PythonEngine } from '../src/interpreter/python';
import { ClickHouseEngine, SupabaseEngine } from '../src/remote';
import * as duckdbSchema from '../src/duckdb/util/schema';
import * as memorySchema from '../src/util/schema';
import * as suggestions from '../src/suggest';
import { schemaMetadataSchema } from '../src/util/schema';

import type { DataSourceConfig, Profile, Schema } from '../src';

vi.mock('@clickhouse/client', () => ({ createClient: vi.fn() }));

const llm = { model: 'unused' };
const source: DataSourceConfig = { type: 'json', options: { data: [{ value: 2 }, { value: 4 }] } };
const schema: Schema = {
  tables: [{ name: 'data', columnCount: 1, fields: [{ name: 'value', type: 'number' }], indexes: [] }],
};
const profile: Profile = {
  generatedAt: 1234,
  tables: [
    {
      ...schema.tables[0],
      metrics: { row_count: 2 },
      fields: [{ ...schema.tables[0].fields[0], logicalType: 'numeric', metrics: { mean: 3 } }],
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('source metadata lifecycle', () => {
  it.each(['duckdb', 'javascript'])(
    'reuses an exported profile with %s and recomputes only on request',
    async (type) => {
      const original = new AVA({ llm, engine: { type } });
      const restored = new AVA({ llm, engine: { type } });
      try {
        await original.source(source);
        const exported = JSON.parse(JSON.stringify(await original.profile()));
        const expectedSchema = await original.schema();
        const expectedProfile = structuredClone(exported);
        const discover =
          type === 'duckdb' ? vi.spyOn(duckdbSchema, 'getDuckDBSchema') : vi.spyOn(memorySchema, 'extractDataSchema');
        const onProfile = vi.fn();
        restored.on('profilestart', onProfile);
        await restored.source(source, { profile: exported });
        expect(discover).not.toHaveBeenCalled();
        expect(onProfile).not.toHaveBeenCalled();
        expect(await restored.schema()).toEqual(expectedSchema);
        expect(await restored.schema()).not.toHaveProperty('generatedAt');
        expect((await restored.schema()).tables[0].fields[0]).not.toHaveProperty('metrics');
        const dsl =
          type === 'duckdb'
            ? 'SELECT SUM(value) AS total FROM data'
            : 'const result = [{total: stat.sum(data, "value")}];';
        const getDSL = vi.spyOn(restored.engine!, 'getDSL').mockResolvedValue(dsl);
        const suggest = vi.spyOn(suggestions, 'generateSuggestions').mockResolvedValue([]);
        const compute = vi.spyOn(restored.engine!, 'profile');
        exported.tables[0].fields[0].name = 'changed by caller';
        exported.tables[0].metrics.row_count = 999;
        await restored.translate('Total');
        expect(getDSL).toHaveBeenLastCalledWith('Total', { schema: expectedSchema, profile: expectedProfile });
        const analysis = await restored.analyze('Total', {
          includeSummary: false,
          strategy: { type: 'direct', maxRetries: 0 },
        });
        expect(analysis.data).toEqual([{ total: 6 }]);
        expect(getDSL).toHaveBeenLastCalledWith('Total', { schema: expectedSchema, profile: expectedProfile });
        await restored.suggest();
        expect(suggest).toHaveBeenLastCalledWith(llm, { schema: expectedSchema, profile: expectedProfile }, 3);
        expect(compute).not.toHaveBeenCalled();
        const recomputed = await restored.profile({ metrics: ['sum'] });
        expect(recomputed.tables[0].fields[0].metrics).toEqual({ sum: 6 });
        await restored.translate('Total');
        expect(getDSL).toHaveBeenLastCalledWith('Total', { schema: expectedSchema, profile: recomputed });
        expect(compute).toHaveBeenCalledExactlyOnceWith(expectedSchema, { metrics: ['sum'] });

        await restored.source(source, { schema: expectedSchema, profile: undefined });
        const nextDSL = vi.spyOn(restored.engine!, 'getDSL').mockResolvedValue(dsl);
        await restored.translate('Total');
        expect(nextDSL).toHaveBeenLastCalledWith('Total', { schema: expectedSchema, profile: undefined });
        expect(discover).not.toHaveBeenCalled();
        await restored.source(source, {});
        expect(discover).not.toHaveBeenCalled();
        await restored.schema();
        await restored.schema();
        expect(discover).toHaveBeenCalledOnce();
      } finally {
        await original.dispose();
        await restored.dispose();
      }
    }
  );

  it('clears failed replacements and can load again without stale metadata', async () => {
    const ava = new AVA({ llm, engine: { type: 'javascript' } });
    try {
      const end = vi.fn();
      ava.on('loadend', end);
      for (const metadata of [{ schema: null }, { profile: { tables: [] } }]) {
        await ava.source(source, { schema, profile });
        const previous = ava.engine!;
        const dispose = vi.spyOn(previous, 'dispose');
        await expect(ava.source(source, metadata as never)).rejects.toThrow();
        expect(dispose).toHaveBeenCalledOnce();
        expect(ava.engine).toBeNull();
        await expect(ava.schema()).rejects.toThrow('No data loaded');
        expect(end).toHaveBeenLastCalledWith(expect.objectContaining({ data: { error: expect.any(Object) } }));
      }

      await ava.source(source, { schema, profile });
      await expect(
        ava.source({ type: 'parquet', options: { path: 'unsupported.parquet' } }, { profile })
      ).rejects.toThrow();
      expect(ava.engine).toBeNull();
      await expect(ava.schema()).rejects.toThrow('No data loaded');
      await ava.source(source);
      const nextDSL = vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('const result = data;');
      await ava.translate('Rows');
      expect(nextDSL).toHaveBeenLastCalledWith('Rows', { schema, profile: undefined });
    } finally {
      await ava.dispose();
    }
    await expect(ava.schema()).rejects.toThrow('No data loaded');
  });
});

describe('engine loading and metadata discovery', () => {
  it.skipIf(process.env.AVA_PYTHON_LOCAL_TEST !== '1')(
    'profiles imported Python structure with the real executor',
    async () => {
      const engine = new PythonEngine(llm);
      try {
        await engine.load(source);
        const savedSchema = await engine.schema();
        savedSchema.tables[0].fields[0].nullable = false;
        savedSchema.tables[0].indexes = [{ name: 'idx', columns: ['value'], unique: true }];
        savedSchema.relations = [
          {
            kind: 'foreign-key',
            from: { table: 'data', columns: ['value'] },
            to: { table: 'data', columns: ['value'] },
          },
        ];
        await engine.load(source);
        const computed = await engine.profile(savedSchema, { metrics: ['row_count', 'mean'] });
        expect(schemaMetadataSchema.parse(computed)).toEqual(savedSchema);
        expect(computed.tables[0].metrics).toEqual({ row_count: 2 });
        expect(computed.tables[0].fields[0].metrics).toEqual({ mean: 3 });
      } finally {
        await engine.dispose();
      }
    },
    30000
  );

  it('skips Supabase catalog requests while keeping query execution available', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ value: 2 }] });
    vi.stubGlobal('fetch', fetch);
    const engine = new SupabaseEngine(llm);
    try {
      expect(
        await engine.load({ type: 'supabase', options: { accessToken: 'test', projectRef: 'test' } })
      ).toBeUndefined();
      expect(fetch).not.toHaveBeenCalled();
      expect((await engine.execute('SELECT value FROM data')).data).toEqual([{ value: 2 }]);
      expect(fetch).toHaveBeenCalledOnce();
    } finally {
      await engine.dispose();
    }
  });

  it('skips ClickHouse catalog requests while still creating and disposing its client', async () => {
    const client = { query: vi.fn(), close: vi.fn() };
    vi.mocked(createClient).mockReturnValue(client as never);
    const engine = new ClickHouseEngine(llm);
    try {
      expect(
        await engine.load({ type: 'clickhouse', options: { url: 'http://localhost:8123', database: 'default' } })
      ).toBeUndefined();
      expect(client.query).not.toHaveBeenCalled();
      client.query.mockResolvedValue({ json: async () => [{ m0: 2 }] });
      expect((await engine.profile(schema, { metrics: ['row_count'] })).tables[0].metrics.row_count).toBe(2);
      expect(client.query).toHaveBeenCalled();
    } finally {
      await engine.dispose();
    }
    expect(client.close).toHaveBeenCalledOnce();
  });

  it('skips Python metadata execution and retains supplied structure when profiling', async () => {
    const input = structuredClone(schema);
    input.tables[0].fields[0].nullable = false;
    input.tables[0].indexes.push({ name: 'idx', columns: ['value'], unique: true });
    input.relations = [
      { kind: 'foreign-key', from: { table: 'data', columns: ['value'] }, to: { table: 'data', columns: ['value'] } },
    ];
    const execute = vi.fn();
    const engine = new PythonEngine(llm, { execute });
    try {
      expect(await engine.load(source)).toBeUndefined();
      expect(execute).not.toHaveBeenCalled();
      const tables = [
        {
          ...input.tables[0],
          metrics: { row_count: 2 },
          fields: [{ ...input.tables[0].fields[0], logicalType: 'numeric', metrics: {} }],
        },
      ];
      execute.mockResolvedValue({ schema: [], data: tables, rowCount: 1 });
      const computed = await engine.profile(input, { metrics: ['row_count'] });
      expect(schemaMetadataSchema.parse(computed)).toEqual(input);
      expect(execute).toHaveBeenCalledOnce();
      expect(execute.mock.calls[0][0]).not.toContain('def field_type');
      execute.mockResolvedValue({ schema: [{ name: 'value' }], data: [{ value: 2 }], rowCount: 1 });
      expect((await engine.execute('result = df')).data).toEqual([{ value: 2 }]);
    } finally {
      await engine.dispose();
    }
  });

  it.each([DuckDBEngine, JavaScriptEngine, PythonEngine, SupabaseEngine, ClickHouseEngine])(
    'requires a loaded source for schema discovery (%s)',
    async (Engine) => {
      const engine = new Engine(llm);
      try {
        await expect(engine.schema()).rejects.toThrow('No data loaded');
      } finally {
        await engine.dispose();
      }
    }
  );
});
