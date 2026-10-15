import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { AVA, createRunContext } from '../src';

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();
  return { ...actual, generateText: vi.fn() };
});

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({ chat: vi.fn(() => 'test-model') })),
}));

const modelUsage = {
  inputTokens: 10,
  inputTokenDetails: { noCacheTokens: 10, cacheReadTokens: undefined, cacheWriteTokens: undefined },
  outputTokens: 5,
  outputTokenDetails: { textTokens: 5, reasoningTokens: undefined },
  totalTokens: 15,
};

function setModelResponses() {
  vi.clearAllMocks();
  vi.mocked(generateText).mockImplementation(async (options) => {
    const prompt = typeof options.prompt === 'string' ? options.prompt.toLowerCase() : '';
    const text = prompt.includes('generate javascript code') ? 'const result = data;' : 'Summary';
    options.onEnd?.({ totalUsage: modelUsage } as never);
    return { text, usage: modelUsage } as never;
  });
}

describe('AVA usage API', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns AI SDK totalUsage aggregated across generation and summary calls', async () => {
    setModelResponses();
    const ava = new AVA({ llm: { model: 'test' }, engine: { type: 'javascript' } });

    try {
      await ava.source({ type: 'json', options: { data: [{ value: 1 }] } });
      const result = await ava.analyze('List the rows');

      expect(result.usage).toEqual({
        inputTokens: 20,
        inputTokenDetails: { noCacheTokens: 20, cacheReadTokens: undefined, cacheWriteTokens: undefined },
        outputTokens: 10,
        outputTokenDetails: { textTokens: 10, reasoningTokens: undefined },
        totalTokens: 30,
      });
      expect(generateText).toHaveBeenCalledTimes(2);
    } finally {
      await ava.dispose();
    }
  });

  it('isolates concurrent analysis results while aggregating them into a shared RunContext', async () => {
    setModelResponses();
    const ava = new AVA({ llm: { model: 'test' }, engine: { type: 'javascript' } });
    const run = createRunContext();

    try {
      await ava.source({ type: 'json', options: { data: [{ value: 1 }] } });
      const results = await Promise.all([
        ava.analyze('First query', {}, run),
        ava.analyze('Second query', {}, run),
      ]);

      expect(results.map(({ usage }) => usage?.totalTokens)).toEqual([30, 30]);
      expect(run.usage.getUsage()?.totalTokens).toBe(60);
      expect(generateText).toHaveBeenCalledTimes(4);
    } finally {
      await ava.dispose();
    }
  });
});
