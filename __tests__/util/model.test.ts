import { afterEach, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { languageModel } from '../../src/util/model';

afterEach(() => vi.unstubAllGlobals());

it('keeps custom OpenAI endpoints on Chat Completions with the upgraded SDK', async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        id: 'test',
        created: 0,
        model: 'test-model',
        choices: [{ index: 0, message: { role: 'assistant', content: 'Working.' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
      }),
      { headers: { 'content-type': 'application/json' } }
    )
  );
  vi.stubGlobal('fetch', fetch);
  const result = await generateText({
    model: languageModel({ model: 'test-model', apiKey: 'test-only', baseURL: 'https://example.invalid/v1' }),
    prompt: 'Hello',
    maxRetries: 0,
  });
  expect(fetch.mock.calls[0][0]).toBe('https://example.invalid/v1/chat/completions');
  expect(result.text).toBe('Working.');
  expect(result.usage).toMatchObject({ inputTokens: 3, outputTokens: 2, totalTokens: 5 });
});
