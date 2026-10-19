import { fork } from 'child_process';
import { EventEmitter } from 'events';
import { createServer } from 'net';
import { mkdir, rm } from 'fs/promises';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSession, request } from '../src/cli/session/client';
import { responseSchema, sessionDirectory, socketPath, startupSchema, requestSchema } from '../src/cli/session/protocol';

import type { DataSourceConfig, EngineConfig, Schema } from '../src/types';

vi.mock('child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('child_process')>()),
  fork: vi.fn(),
}));

const source: DataSourceConfig = { type: 'json', options: { data: [{ sales: 10 }] } };
const llm = { model: 'unused' };
const schema: Schema = {
  tables: [{ name: 'data', columnCount: 1, fields: [{ name: 'sales', type: 'number' }], indexes: [] }],
  relations: [],
};

describe('session startup protocol', () => {
  it('keeps engine selection through the child-process startup message', async () => {
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
      expect(startupSchema.parse(worker.send.mock.calls[0][0])).toEqual({
        source,
        llm,
        engine: 'python',
      });
      expect(worker.disconnect).toHaveBeenCalledOnce();
      expect(worker.unref).toHaveBeenCalledOnce();
    } finally {
      await rm(sessionDirectory(datasetId), { recursive: true, force: true });
    }
  });

  it('accepts legacy startup messages and rejects custom engine configuration', () => {
    expect(startupSchema.parse({ source, llm })).toEqual({ source, llm });
    for (const engine of ['invalid', { type: 'python', execute: 'custom' }]) {
      expect(() => startupSchema.parse({ source, llm, engine })).toThrow();
    }
  });

  it('accepts structured and legacy errors in IPC responses', () => {
    expect(responseSchema.parse({ ok: false, error: 'Legacy error' })).toEqual({
      ok: false,
      error: 'Legacy error',
    });
    expect(
      responseSchema.parse({
        ok: false,
        error: { name: 'SupabaseApiError', message: 'Unauthorized', category: 'authentication', status: 401 },
      })
    ).toMatchObject({
      ok: false,
      error: { category: 'authentication', status: 401 },
    });
  });

  it('restores structured error details from a CLI session response', async () => {
    const id = 'ds_errors_012345abcdef';
    const directory = sessionDirectory(id);
    const server = createServer((socket) =>
      socket.end(
        JSON.stringify({
          ok: false,
          error: {
            name: 'SupabaseApiError',
            message: 'Unauthorized',
            category: 'authentication',
            status: 401,
          },
        })
      )
    );

    await mkdir(directory, { recursive: true, mode: 0o700 });
    await new Promise<void>((resolve) => server.listen(socketPath(id), resolve));
    try {
      await expect(request(id, { command: 'dispose' })).rejects.toMatchObject({
        name: 'SupabaseApiError',
        message: 'Unauthorized',
        category: 'authentication',
        status: 401,
      });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('validates metadata in command requests and rejects it at startup', () => {
    expect(requestSchema.parse({ command: 'schema', schema })).toEqual({ command: 'schema', schema });
    expect(() => requestSchema.parse({ command: 'schema', schema: { tables: null } })).toThrow();
    expect(() => requestSchema.parse({ command: 'profile', profile: { tables: [] } })).toThrow();
    expect(() => startupSchema.parse({ source, llm, metadata: { schema } })).toThrow();
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

  it('forwards imported profiles through the dataset session to model context', async () => {
    const profile = {
      generatedAt: 1234,
      tables: [
        {
          ...schema.tables[0],
          metrics: { row_count: 1 },
          fields: [{ ...schema.tables[0].fields[0], logicalType: 'numeric' as const, metrics: { sum: 10 } }],
        },
      ],
      relations: [],
    };
    await datasets.createDataset(source, llm, 'javascript');
    expect(await datasets.describeDataset(schema)).toMatchObject(schema);
    await datasets.withDataset((ava) => ava.profile(undefined, () => profile));
    const getDSL = await datasets.withDataset(async (ava) =>
      vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('const result = data;')
    );
    await datasets.withDataset((ava) => ava.translate('Sales'));
    expect(getDSL).toHaveBeenLastCalledWith('Sales', { schema, profile });
  });
});
