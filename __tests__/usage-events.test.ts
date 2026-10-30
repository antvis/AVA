import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { AVA, withOperationEvents } from '../src';
import { JavaScriptEngine } from '../src/interpreter/javascript';

vi.mock('ai', async (importOriginal) => ({ ...(await importOriginal<typeof import('ai')>()), generateText: vi.fn() }));
vi.mock('../src/util/model', () => ({ languageModel: vi.fn() }));

const usage = { inputTokens: 10, outputTokens: 5, totalTokens: 15 };
const config = { llm: { model: 'test' } };

beforeEach(() => vi.resetAllMocks());

function reply(text: string) {
  vi.mocked(generateText).mockResolvedValueOnce({ text, usage } as never);
}

describe.each(['javascript', 'duckdb'])('%s text source usage', (type) => {
  it.each([true, false])('reports usage when parsing %s', async (valid) => {
    const ava = new AVA({ ...config, engine: { type } });
    const listener = vi.fn();
    ava.on('sourceend', listener);
    reply(valid ? '[{"value":1}]' : 'not json');
    if (valid) await ava.source({ type: 'text', options: { text: 'one' } });
    else await expect(ava.source({ type: 'text', options: { text: 'one' } })).rejects.toThrow();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ usage }) }));
    if (!valid) expect(listener.mock.calls[0][0].data.error).toBeDefined();
    await ava.dispose();
  });
});

describe('suggestion usage', () => {
  it.each([true, false])('reports usage when parsing %s', async (valid) => {
    const ava = new AVA({ ...config, engine: { type: 'javascript' } });
    await ava.source({ type: 'json', options: { data: [{ value: 1 }] } });
    const listener = vi.fn();
    ava.on('suggestend', listener);
    reply(valid ? '[{"query":"total?","score":1,"reason":"useful"}]' : 'not json');
    if (valid) await ava.suggest();
    else await expect(ava.suggest()).rejects.toThrow();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ usage }) }));
    if (!valid) expect(listener.mock.calls[0][0].data.error).toBeDefined();
    await ava.dispose();
  });
});

describe('translation operation usage', () => {
  it('rejects an async wrapper that drops the operation event channel', async () => {
    const ava = new AVA({ ...config, engine: { type: 'javascript' } });
    await ava.source({ type: 'json', options: { data: [{ value: 1 }] } });
    const wrapped = async () =>
      withOperationEvents(async (events) => {
        events.emit('translateend', { data: { usage } });
        return 'const result = data;';
      });
    vi.spyOn(ava.engine!, 'getDSL').mockImplementation(wrapped as never);
    const listener = vi.fn();
    ava.on('translateend', listener);
    await expect(ava.translate('rows')).rejects.toThrow('Engine operations must return an Operation');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { error: expect.objectContaining({ message: expect.stringContaining('Operation') }) },
      })
    );
    await ava.dispose();
  });

  it('ignores end events without usage after a usage event', async () => {
    const ava = new AVA({ ...config, engine: { type: 'javascript' } });
    await ava.source({ type: 'json', options: { data: [{ value: 1 }] } });
    vi.spyOn(ava.engine!, 'getDSL').mockImplementation(() =>
      withOperationEvents(async (events) => {
        events.emit('translateend', { data: { usage } });
        events.emit('translateend', { data: { dsl: 'const result = data;' } });
        events.emit('translateend', { data: null });
        events.emit('translateend');
        return 'const result = data;';
      })
    );
    const listener = vi.fn();
    ava.on('translateend', listener);
    await ava.translate('rows');
    await ava.analyze('rows', { includeSummary: false });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls.map(([event]) => event.data.usage)).toEqual([usage, usage]);
    await ava.dispose();
  });

  it('keeps concurrent calls on the same engine independent', async () => {
    const ava = new AVA({ ...config, engine: { type: 'javascript' } });
    await ava.source({ type: 'json', options: { data: [{ value: 1 }] } });
    const ends: Array<{ data: { dsl: string; usage: { totalTokens: number } } }> = [];
    ava.on('translateend', (event) => ends.push(event));
    vi.mocked(generateText).mockImplementation(async ({ prompt }) => {
      const first = String(prompt).includes('first question');
      if (first) await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        text: first ? 'const result = 1;' : 'const result = 2;',
        usage: { totalTokens: first ? 10 : 20 },
      } as never;
    });
    await Promise.all([ava.translate('first question'), ava.translate('second question')]);
    expect(ends.map(({ data }) => [data.dsl, data.usage.totalTokens])).toEqual([
      ['const result = 2;', 20],
      ['const result = 1;', 10],
    ]);
    await ava.dispose();
  });
});

it('rejects an async load wrapper without an event channel', async () => {
  const ava = new AVA({ ...config, engine: { type: 'javascript' } });
  const wrapped = async () => withOperationEvents(async () => {});
  vi.spyOn(JavaScriptEngine.prototype, 'load').mockImplementationOnce(wrapped as never);
  await expect(ava.source({ type: 'json', options: { data: [{ value: 1 }] } })).rejects.toThrow(
    'Engine operations must return an Operation',
  );
  await ava.dispose();
});

it('ignores source end events without usage after a usage event', async () => {
  const ava = new AVA({ ...config, engine: { type: 'javascript' } });
  const load = vi.spyOn(JavaScriptEngine.prototype, 'load').mockImplementationOnce(() =>
    withOperationEvents(async (events) => {
      events.emit('sourceend', { data: { usage } });
      events.emit('sourceend', { data: {} });
      events.emit('sourceend', { data: null });
    events.emit('sourceend');
    })
  );
  const listener = vi.fn();
  ava.on('sourceend', listener);
  await ava.source({ type: 'json', options: { data: [{ value: 1 }] } });
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ data: { usage } }));
  load.mockRestore();
  await ava.dispose();
});
