import { fork } from 'child_process';
import { EventEmitter } from 'events';
import { rm } from 'fs/promises';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSession } from '../src/cli/session/client';
import { buildDataModel } from '../src/util/data-model';
import { sessionDirectory, startupSchema, requestSchema } from '../src/cli/session/protocol';

import type { DataSourceConfig, EngineConfig, Schema } from '../src/types';

vi.mock('child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('child_process')>()),
  fork: vi.fn(),
}));

const source: DataSourceConfig = { type: 'json', options: { data: [{ sales: 10 }] } };
const llm = { model: 'unused' };
const schema: Schema = {
  models: [{ name: 'data', columns: [{ name: 'sales', type: 'number' }], tableReference: { table: 'data' } }],
  relationships: [],
};

const sqlserverSource = {
  type: 'sqlserver' as const,
  options: { host: 'localhost', database: 'sales', user: 'reader', password: 'test-password' },
};

describe('session startup protocol', () => {
  const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
  afterEach(() => {
    Object.defineProperty(process, 'platform', platform);
    vi.clearAllMocks();
  });
  it('keeps engine selection through the child-process startup message', async () => {
    Object.defineProperty(process, 'platform', { ...platform, value: 'linux' });
    const worker = Object.assign(new EventEmitter(), {
      connected: true,
      disconnect: vi.fn(),
      unref: vi.fn(),
      send: vi.fn<(message: unknown, callback: (error?: Error) => void) => void>(),
    });
    worker.send.mockImplementation(() => queueMicrotask(() => worker.emit('message', { ok: true, result: null })));
    vi.mocked(fork).mockReturnValueOnce(worker as unknown as ReturnType<typeof fork>);
    const { datasetId } = await createSession(source, llm, 'python');
    try {
      expect(startupSchema.parse(worker.send.mock.calls[0][0])).toEqual({ source, llm, engine: 'python' });
      expect(worker.disconnect).toHaveBeenCalledOnce();
      expect(worker.unref).toHaveBeenCalledOnce();
    } finally {
      await rm(sessionDirectory(datasetId), { recursive: true, force: true });
    }
  });

  it('rejects Windows before creating a dataset process', async () => {
    Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
    await expect(createSession(source, llm)).rejects.toThrow('Dataset sessions currently require macOS or Linux.');
    expect(fork).not.toHaveBeenCalled();
  });

  it('accepts legacy startup messages and rejects custom engine configuration', () => {
    expect(startupSchema.parse({ source, llm })).toEqual({ source, llm });
    for (const engine of ['invalid', { type: 'python', execute: 'custom' }]) {
      expect(() => startupSchema.parse({ source, llm, engine })).toThrow();
    }
  });

  it('validates metadata in command requests and rejects it at startup', () => {
    expect(requestSchema.parse({ command: 'schema', schema })).toEqual({ command: 'schema', schema });
    expect(() => requestSchema.parse({ command: 'schema', schema: { models: null } })).toThrow();
    expect(() => requestSchema.parse({ command: 'profile', profile: { models: null } })).toThrow();
    expect(requestSchema.parse({ command: 'semantic' })).toEqual({ command: 'semantic' });
    expect(requestSchema.parse({ command: 'semantic', semantic: {} })).toEqual({ command: 'semantic', semantic: {} });
    expect(() => requestSchema.parse({ command: 'semantic', semantic: { models: null } })).toThrow();
    expect(() =>
      requestSchema.parse({
        command: 'semantic',
        semantic: { models: [{ name: 'data', tableReference: { table: 'data' }, metrics: { row_count: 1 } }] },
      })
    ).toThrow();
    expect(() => startupSchema.parse({ source, llm, metadata: { schema } })).toThrow();
  });

  it('preserves SQL Server source fields and engine through the startup protocol', () => {
    const source = {
      ...sqlserverSource,
      options: {
        ...sqlserverSource.options,
        port: 11433,
        schema: 'reporting',
        encrypt: false,
        trustServerCertificate: true,
        connectionTimeoutMs: 5000,
        requestTimeoutMs: 12000,
      },
    };
    expect(startupSchema.parse({ source, llm, engine: 'sqlserver' })).toEqual({ source, llm, engine: 'sqlserver' });
  });
});

describe('dataset engine and language', () => {
  let datasets: typeof import('../src/cli/session/datasets');

  beforeEach(async () => {
    vi.resetModules();
    datasets = await import('../src/cli/session/datasets');
  });

  afterEach(async () => {
    await datasets.disposeDataset();
    vi.restoreAllMocks();
  });

  it.each<{ source: DataSourceConfig; engine: EngineConfig['type']; explicit?: EngineConfig['type'] }>([
    { source, engine: 'duckdb' },
    { source, engine: 'python', explicit: 'python' },
    { source, engine: 'javascript', explicit: 'javascript' },
    { source: { type: 'supabase', options: { accessToken: 'test', projectRef: 'test' } }, engine: 'supabase' },
    { source: { type: 'clickhouse', options: { host: 'localhost', database: 'sales' } }, engine: 'clickhouse' },
    { source: sqlserverSource, engine: 'sqlserver' },
  ])('selects $engine and exposes its language without changing the schema', async ({ source, engine, explicit }) => {
    const { getEngineClass } = await import('../src/engines');
    const Engine = getEngineClass(engine);
    const load = vi.spyOn(Engine.prototype, 'load').mockResolvedValue(undefined);
    const discover = vi.spyOn(Engine.prototype, 'schema').mockResolvedValue(schema);

    await datasets.createDataset(source, llm, explicit);
    const instance = await datasets.withDataset((ava) => Promise.resolve(ava.engine));
    expect(instance).toBeInstanceOf(Engine);
    expect(load).toHaveBeenCalledExactlyOnceWith(source);
    expect(discover).not.toHaveBeenCalled();
    expect(await datasets.describeDataset()).toEqual({ ...schema, language: instance!.language });
    expect(discover).toHaveBeenCalledOnce();
    if (engine === 'python') {
      expect(instance!.language.fence).toBe('python');
      expect(instance!.language.instructions).toContain('tables');
      expect(instance!.language.instructions).toContain('result');
    }
  });

  it('executes JavaScript through the selected session without an API key', async () => {
    await datasets.createDataset(source, llm, 'javascript');
    expect((await datasets.describeDataset()).language.fence).toBe('javascript');
    const result = await datasets.withDataset((ava) => ava.query('const result = [{ total: data[0].sales * 2 }];'));
    expect(result.data).toEqual([{ total: 20 }]);
    expect(result.rowCount).toBe(1);
  });

  it('retains imported semantics alongside schema and profile in model context', async () => {
    const profile = {
      models: [
        {
          name: schema.models[0].name,
          metrics: { row_count: 1 },
          columns: [
            {
              name: schema.models[0].columns[0].name,
              properties: { logicalType: 'numeric' as const },
              metrics: { sum: 10 },
            },
          ],
        },
      ],
    };
    await datasets.createDataset(source, llm, 'javascript');
    const semantic = { description: 'Sales are in USD.', properties: { confirmedBy: 'user' } };
    expect(await datasets.withDataset((ava) => ava.semantic())).toEqual({});
    await datasets.withDataset((ava) => ava.semantic(undefined, () => semantic));
    expect(await datasets.describeDataset(schema)).toMatchObject(schema);
    await datasets.withDataset((ava) => ava.profile(undefined, () => profile));
    const getDSL = await datasets.withDataset(async (ava) =>
      vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue({ dsl: 'const result = data;' })
    );
    await datasets.withDataset((ava) => ava.translate('Sales'));
    expect(getDSL).toHaveBeenLastCalledWith('Sales', buildDataModel({ schema, profile, semantic }));
    await expect(datasets.withDataset((ava) => ava.semantic(undefined, () => ({ models: null })))).rejects.toThrow();
    expect(await datasets.withDataset((ava) => ava.semantic())).toEqual(semantic);
    await datasets.withDataset((ava) => ava.semantic(undefined, () => ({})));
    await datasets.withDataset((ava) => ava.translate('Sales'));
    expect(getDSL).toHaveBeenLastCalledWith('Sales', buildDataModel({ schema, profile }));
  });
});
