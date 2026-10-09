import { afterEach, describe, expect, it, vi } from 'vitest';

import { PythonInterpreterEngine } from '../../../src/interpreter/python/engine';
import * as pythonExecutor from '../../../src/interpreter/python/util/execute';

const source = { type: 'json' as const, options: { data: [{ value: 2 }] } };
const table = { name: 'data', columnCount: 1, indexes: [], fields: [{ name: 'value', type: 'int64' }] };
const metadata = { data: [table], schema: [], rowCount: 1 };
const answer = { data: [{ value: 2 }], schema: [{ name: 'value', type: 'int64' }], rowCount: 1 };

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('python/engine', () => {
  it('initializes the default executor once and preserves per-call buffer limits', async () => {
    const execute = vi.fn().mockResolvedValueOnce(metadata).mockResolvedValue(answer);
    const createExecutor = vi.spyOn(pythonExecutor, 'createPythonExecutor').mockReturnValue(execute);
    const engine = new PythonInterpreterEngine({ model: 'unused' }, { queryTimeoutMs: 1234 });
    expect(createExecutor).toHaveBeenCalledExactlyOnceWith(1234);
    await engine.load(source);
    await engine.execute('result = df', { maxResultBytes: 100 });
    await engine.execute('result = df', { maxResultBytes: 200 });
    expect(createExecutor).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls.map((call) => call[1])).toEqual([2 * 1024 * 1024, 1024 * 1024 + 100, 1024 * 1024 + 200]);

    new PythonInterpreterEngine({ model: 'unused' }, { execute });
    expect(createExecutor).toHaveBeenCalledTimes(1);
  });

  it('rejects operations without a valid source and recovers after reloading', async () => {
    const execute = vi.fn().mockResolvedValue(metadata);
    const engine = new PythonInterpreterEngine({ model: 'unused' }, { execute });
    const expectUnloaded = async () => {
      await expect(engine.execute('result = 1')).rejects.toThrow('No data loaded');
      await expect(engine.profile()).rejects.toThrow('No data loaded');
      await expect(engine.getDSL('sum')).rejects.toThrow('No data loaded');
    };
    await expectUnloaded();
    await engine.load(source);
    execute.mockRejectedValueOnce(new Error('load failed'));
    await expect(engine.load(source)).rejects.toThrow('load failed');
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
    const engine = new PythonInterpreterEngine({ model: 'unused' }, { execute, queryTimeoutMs: 20 });
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
