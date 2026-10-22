import { afterEach, describe, expect, it, vi } from 'vitest';

import { PythonEngine } from '../../../src/interpreter/python/engine';
import * as pythonExecutor from '../../../src/interpreter/python/util/execute';

import type { Schema } from '../../../src/types';

const source = { type: 'json' as const, options: { data: [{ value: 2 }] } };
const table = { name: 'data', columns: [{ name: 'value', type: 'int64' }], tableReference: { table: 'data' } };
const metadata = { data: [table], schema: [], rowCount: 1 };
const answer = { data: [{ value: 2 }], schema: [{ name: 'value', type: 'int64' }], rowCount: 1 };

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('python/engine', () => {
  it('requires a loaded source for schema discovery', async () => {
    const engine = new PythonEngine({ model: 'unused' });
    try {
      await expect(engine.schema()).rejects.toThrow('No data loaded');
    } finally {
      await engine.dispose();
    }
  });

  it.each(['all_varchar', 'ignore_errors', 'stop_at_empty', 'empty_as_varchar', 'normalize_names'])(
    'rejects DuckDB-only Excel setting %s before executing Python',
    async (key) => {
      const execute = vi.fn();
      const engine = new PythonEngine({ model: 'unused' }, { execute });
      await expect(
        engine.load({ type: 'excel', options: { path: 'data.xlsx', sheets: [{ sheet: 'Sales', [key]: false }] } })
      ).rejects.toThrow('Unrecognized key');
      expect(execute).not.toHaveBeenCalled();
    }
  );

  it('initializes the default executor once and preserves per-call buffer limits', async () => {
    const execute = vi.fn().mockResolvedValueOnce(metadata).mockResolvedValue(answer);
    const createExecutor = vi.spyOn(pythonExecutor, 'createPythonExecutor').mockReturnValue(execute);
    const engine = new PythonEngine({ model: 'unused' }, { queryTimeoutMs: 1234 });
    expect(createExecutor).toHaveBeenCalledExactlyOnceWith(1234);
    await engine.load(source);
    await engine.schema();
    await engine.execute('result = df', { maxResultBytes: 100 });
    await engine.execute('result = df', { maxResultBytes: 200 });
    expect(createExecutor).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls.map((call) => call[1])).toEqual([2 * 1024 * 1024, 1024 * 1024 + 100, 1024 * 1024 + 200]);

    new PythonEngine({ model: 'unused' }, { execute });
    expect(createExecutor).toHaveBeenCalledTimes(1);
  });

  it('rejects operations without a valid source and recovers after reloading', async () => {
    const execute = vi.fn().mockResolvedValue(metadata);
    const engine = new PythonEngine({ model: 'unused' }, { execute });
    const expectUnloaded = async () => {
      await expect(engine.execute('result = 1')).rejects.toThrow('No data loaded');
      await expect(engine.profile({ models: [] })).rejects.toThrow('No data loaded');
      await expect(engine.getDSL('sum', { models: [] })).rejects.toThrow('No data loaded');
    };
    await expectUnloaded();
    await engine.load(source);
    await expect(engine.load({ type: 'json', options: {} } as never)).rejects.toThrow();
    await expectUnloaded();
    await engine.load(source);
    await engine.dispose();
    await expectUnloaded();
    await engine.load(source);
    execute.mockResolvedValueOnce(answer);
    await expect(engine.execute('result = df')).resolves.toEqual(answer);
  });

  it('rejects invalid executor results, propagates failures and times out stalled execution', async () => {
    const execute = vi.fn().mockResolvedValue(metadata);
    const engine = new PythonEngine({ model: 'unused' }, { execute, queryTimeoutMs: 20 });
    await engine.load(source);
    execute.mockResolvedValueOnce({ ...answer, data: [1] });
    await expect(engine.execute('result = 1')).rejects.toThrow();
    const failure = new Error('executor failed');
    execute.mockRejectedValueOnce(failure);
    await expect(engine.execute('result = 1')).rejects.toBe(failure);
    vi.useFakeTimers();
    execute.mockReturnValueOnce(new Promise(() => {}));
    const pending = expect(engine.execute('result = 1')).rejects.toThrow('timed out after 20ms');
    await vi.advanceTimersByTimeAsync(20);
    await pending;
  });
});

describe('python/engine metadata', () => {
  const llm = { model: 'unused' };
  const source = { type: 'json' as const, options: { data: [{ value: 2 }, { value: 4 }] } };
  const schema: Schema = {
    models: [{ name: 'data', columns: [{ name: 'value', type: 'number' }], tableReference: { table: 'data' } }],
  };

  it.skipIf(process.env.AVA_PYTHON_LOCAL_TEST !== '1')(
    'profiles imported Python structure with the real executor',
    async () => {
      const engine = new PythonEngine(llm);
      try {
        await engine.load(source);
        const savedSchema = await engine.schema();
        savedSchema.models[0].columns[0].notNull = true;
        savedSchema.models[0].uniqueKeys = ['value'];
        savedSchema.relationships = [
          {
            name: 'fk:["data",["value"],"data",["value"]]',
            models: ['data', 'data'],
            joinType: 'MANY_TO_ONE',
            condition: '"data"."value" = "data"."value"',
          },
        ];
        const before = structuredClone(savedSchema);
        await engine.load(source);
        const computed = await engine.profile(savedSchema, { metrics: ['row_count', 'mean'] });
        expect(computed).toEqual({
          models: [
            {
              name: 'data',
              metrics: { row_count: 2 },
              columns: [{ name: 'value', properties: { logicalType: 'numeric' }, metrics: { mean: 3 } }],
            },
          ],
        });
        expect(savedSchema).toEqual(before);
      } finally {
        await engine.dispose();
      }
    },
    30000
  );

  it('skips Python metadata execution and retains supplied structure when profiling', async () => {
    const input = structuredClone(schema);
    input.models[0].columns[0].notNull = true;
    input.models[0].uniqueKeys = ['value'];
    input.relationships = [
      {
        name: 'fk:["data",["value"],"data",["value"]]',
        models: ['data', 'data'],
        joinType: 'MANY_TO_ONE',
        condition: '"data"."value" = "data"."value"',
      },
    ];
    const execute = vi.fn();
    const engine = new PythonEngine(llm, { execute });
    try {
      expect(await engine.load(source)).toBeUndefined();
      expect(execute).not.toHaveBeenCalled();
      const tables = [
        {
          name: input.models[0].name,
          metrics: { row_count: 2 },
          columns: [{ name: input.models[0].columns[0].name, properties: { logicalType: 'numeric' }, metrics: {} }],
        },
      ];
      execute.mockResolvedValue({ schema: [], data: tables, rowCount: 1 });
      const computed = await engine.profile(input, { metrics: ['row_count'] });
      expect(computed).toEqual({ models: tables });
      expect(input.models[0].uniqueKeys).toEqual(['value']);
      expect(execute).toHaveBeenCalledOnce();
      expect(execute.mock.calls[0][0]).not.toContain('def field_type');
      execute.mockResolvedValue({ schema: [{ name: 'value' }], data: [{ value: 2 }], rowCount: 1 });
      expect((await engine.execute('result = df')).data).toEqual([{ value: 2 }]);
    } finally {
      await engine.dispose();
    }
  });
});
