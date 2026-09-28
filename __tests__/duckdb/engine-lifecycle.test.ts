// Separate from engine.test.ts: hoisted loader/profile mocks must not affect
// the real DuckDB execution tests in that file.
import { DuckDBInstance } from '@duckdb/node-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DuckDBEngine, QueryTimeoutError } from '../../src/duckdb/engine';
import { loadSource } from '../../src/duckdb/loaders';
import { profileTables } from '../../src/duckdb/profile';
import { DuckDBQueryDialect } from '../../src/query/duckdb';

import { OFFLINE_LLM } from './test-utils';

import type { LoadedSource, Schema } from '../../src/types';

vi.mock('../../src/duckdb/loaders', () => ({ loadSource: vi.fn() }));
vi.mock('../../src/duckdb/profile', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/duckdb/profile')>();
  return { ...original, profileTables: vi.fn() };
});

// Fake connection + virtual time: no native runaway query, real
// sleeping, credentials, source download or process-global concurrency claims.
const schema: Schema = { tables: [], relations: [] };
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), 100);
  });
}

describe('DuckDBEngine lifecycle', () => {
  let engine: DuckDBEngine;
  let events: string[];
  const reader = {
    columnCount: 1,
    columnName: () => 'value',
    columnType: () => ({ toString: () => 'INTEGER' }),
    getRowObjectsJson: () => [{ value: 1 }],
  };
  let connection: {
    run: ReturnType<typeof vi.fn>;
    runAndReadAll: ReturnType<typeof vi.fn>;
    interrupt: ReturnType<typeof vi.fn>;
    closeSync: ReturnType<typeof vi.fn>;
  };
  let source: LoadedSource;

  beforeEach(() => {
    vi.useFakeTimers();
    events = [];
    connection = {
      run: vi.fn(async (sql: string) => {
        events.push(sql);
      }),
      runAndReadAll: vi.fn(async () => reader),
      interrupt: vi.fn(),
      closeSync: vi.fn(),
    };
    const instance = { connect: vi.fn(async () => connection), closeSync: vi.fn() };
    vi.spyOn(DuckDBInstance, 'create').mockResolvedValue(instance as unknown as DuckDBInstance);
    source = {
      register: vi.fn(async () => {
        events.push('register');
        return ['data'];
      }),
      getSchema: vi.fn(async () => {
        events.push('schema');
        return schema;
      }),
      allowedDirectories: [],
      cleanup: vi.fn(async () => undefined),
    };
    vi.mocked(loadSource).mockResolvedValue(source);
    vi.mocked(profileTables).mockResolvedValue({ tables: [], relations: [], generatedAt: 1 });
    vi.spyOn(DuckDBQueryDialect.prototype, 'validateDSL').mockResolvedValue(undefined);
    engine = new DuckDBEngine(OFFLINE_LLM, { queryTimeoutMs: 10, memoryLimit: '64MB', threads: 1 });
  });
  afterEach(async () => {
    try {
      // Settle every injected 100ms operation even when its assertion failed.
      await vi.runAllTimersAsync();
      await engine?.dispose();
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
      vi.clearAllMocks();
    }
  });

  it('sets resource limits before locking the session configuration', async () => {
    await engine.load({ type: 'csv-file', options: { path: '/test-owned/source.csv' } });
    const memory = events.indexOf("SET memory_limit = '64MB'");
    const threads = events.indexOf('SET threads = 1');
    const lock = events.indexOf('SET lock_configuration = true');
    expect(memory).toBeGreaterThanOrEqual(0);
    expect(threads).toBeGreaterThanOrEqual(0);
    expect(memory).toBeLessThan(lock);
    expect(threads).toBeLessThan(lock);
    expect(events.indexOf('SET enable_external_access = false')).toBeLessThan(lock);
    expect(events[events.length - 1]).toBe('SET lock_configuration = true');
  });

  it('interrupts execution when the configured query timeout expires', async () => {
    await engine.load({ type: 'csv-file', options: { path: '/test-owned/source.csv' } });
    connection.runAndReadAll.mockImplementationOnce(() => delay(reader));
    const result = engine.execute('SELECT 1 AS value');
    const rejected = expect(result).rejects.toBeInstanceOf(QueryTimeoutError);
    await vi.advanceTimersByTimeAsync(11);
    await rejected;
    expect(connection.interrupt).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(100);
    expect(connection.runAndReadAll).toHaveBeenCalledOnce();
  });

  it('clears the timer after a query completes normally', async () => {
    await engine.load({ type: 'csv-file', options: { path: '/test-owned/source.csv' } });
    expect((await engine.execute('SELECT 1 AS value')).data).toEqual([{ value: 1 }]);
    await vi.advanceTimersByTimeAsync(100);
    expect(connection.interrupt).not.toHaveBeenCalled();
  });

  it('allows execution to finish when queryTimeoutMs is zero', async () => {
    engine = new DuckDBEngine(OFFLINE_LLM, { queryTimeoutMs: 0 });
    await engine.load({ type: 'csv-file', options: { path: '/test-owned/source.csv' } });
    connection.runAndReadAll.mockImplementationOnce(() => delay(reader));
    const result = engine.execute('SELECT 1 AS value');
    await vi.advanceTimersByTimeAsync(100);
    expect((await result).data).toEqual([{ value: 1 }]);
    expect(connection.interrupt).not.toHaveBeenCalled();
  });

  it('passes selected profile metrics to the profile implementation', async () => {
    await engine.load({ type: 'csv-file', options: { path: '/test-owned/source.csv' } });
    await engine.profile({ metrics: ['row_count'] });
    expect(profileTables).toHaveBeenCalledWith(connection, schema, { metrics: [{ id: 'row_count' }] });
  });

  it('cleans an owned source once when registration fails', async () => {
    vi.mocked(source.register).mockRejectedValueOnce(new Error('injected parse failure'));
    await expect(engine.load({ type: 'csv-file', options: { path: '/test-owned/source.csv' } })).rejects.toThrow(
      'injected parse failure'
    );
    expect(source.cleanup).toHaveBeenCalledOnce();
    expect(connection.closeSync).toHaveBeenCalledOnce();
    await engine.dispose();
    expect(source.cleanup).toHaveBeenCalledOnce();
  });

  it('makes repeated disposal idempotent for an owned source', async () => {
    await engine.load({ type: 'csv-file', options: { path: '/test-owned/source.csv' } });
    await engine.dispose();
    await engine.dispose();
    expect(source.cleanup).toHaveBeenCalledOnce();
    expect(connection.closeSync).toHaveBeenCalledOnce();
  });
});
