import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { AVA } from '../src';
import * as engines from '../src/engines';
import { InterpreterEngine } from '../src/interpreter';
import { LifecycleEvent } from '../src/util/event';

let ava: AVA;
let events: LifecycleEvent[];
const source = { type: 'json' as const, options: { data: [{ value: 2 }] } };
const names = () => events.map((event) => event.type);

beforeEach(() => {
  ava = new AVA({ llm: { model: 'offline', apiKey: 'not-for-events' }, engine: { type: 'interpreter' } });
  events = [];
  ava.on('*', (event) => {
    if (event instanceof LifecycleEvent) events.push(event);
  });
});

afterEach(async () => {
  vi.restoreAllMocks();
  await ava.dispose();
});

it('emits creation and disposal for initial loading, replacement, and explicit cleanup', async () => {
  expect(ava.engine).toBeNull();
  await ava.dispose();
  expect(events).toEqual([]);
  await ava.source(source);
  const first = ava.engine;
  await ava.source(source);
  expect(ava.engine).not.toBe(first);
  await ava.dispose();
  expect(ava.engine).toBeNull();
  expect(names()).toEqual([
    'createstart',
    'createend',
    'disposestart',
    'disposeend',
    'createstart',
    'createend',
    'disposestart',
    'disposeend',
  ]);
  expect(events.map((event) => event.error)).toEqual(Array(8).fill(undefined));
  expect(events.every((event) => !('data' in event))).toBe(true);
  await ava.dispose();
  expect(events).toHaveLength(8);
});

it('reports constructor errors and emits disposal when loading a new engine fails', async () => {
  const creationError = new Error('Cannot create engine');
  const lookup = vi.spyOn(engines, 'getEngineClass').mockReturnValueOnce(
    class extends InterpreterEngine {
      constructor() {
        super({ model: 'offline' });
        throw creationError;
      }
    }
  );
  await expect(ava.source(source)).rejects.toBe(creationError);
  expect(names()).toEqual(['createstart', 'createend']);
  expect(events[1].error).toEqual({ name: 'Error', message: creationError.message });
  expect(ava.engine).toBeNull();
  lookup.mockRestore();

  events.length = 0;
  const loadError = new Error('Cannot load data');
  vi.spyOn(InterpreterEngine.prototype, 'load').mockRejectedValueOnce(loadError);
  const dispose = vi.spyOn(InterpreterEngine.prototype, 'dispose');
  await expect(ava.source(source)).rejects.toBe(loadError);
  expect(names()).toEqual(['createstart', 'createend', 'disposestart', 'disposeend']);
  expect(dispose).toHaveBeenCalledOnce();
  expect(ava.engine).toBeNull();
});

it.each(['dispose', 'source'] as const)(
  'reports disposal errors during %s and preserves the engine for cleanup',
  async (operation) => {
    await ava.source(source);
    events.length = 0;
    const engine = ava.engine!;
    const error = new Error('Cannot dispose engine');
    vi.spyOn(engine, 'dispose').mockRejectedValueOnce(error);
    await expect(operation === 'dispose' ? ava.dispose() : ava.source(source)).rejects.toBe(error);
    expect(names()).toEqual(['disposestart', 'disposeend']);
    expect(events[1].error).toEqual({ name: 'Error', message: error.message });
    expect(ava.engine).toBe(engine);
    await ava.dispose();
    expect(ava.engine).toBeNull();
    expect(names()).toEqual(['disposestart', 'disposeend', 'disposestart', 'disposeend']);
  }
);
