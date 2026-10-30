import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { AVA } from '../src';

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
