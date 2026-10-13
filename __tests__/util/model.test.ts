import { afterEach, expect, it, vi } from 'vitest';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { languageModel } from '../../src/util/model';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('uses the supplied model instance without requiring or overriding its configuration', () => {
  const model = createOpenAI({ apiKey: 'external-key', baseURL: 'https://external.invalid/v1' }).chat('external-model');
  expect(languageModel({ model })).toBe(model);
  expect(languageModel({ model, provider: 'gateway' })).toBe(model);
});

it.each(['config', 'environment'])('keeps default provider behavior with endpoint from %s', async (source) => {
  if (source === 'environment') {
    vi.stubEnv('OPENAI_BASE_URL', 'https://example.invalid/v1');
    vi.stubEnv('OPENAI_API_KEY', 'test-only');
  }
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
    model: languageModel(
      source === 'config'
        ? { model: 'test-model', apiKey: 'test-only', baseURL: 'https://example.invalid/v1' }
        : { model: 'test-model' }
    ),
    prompt: 'Hello',
    maxRetries: 0,
  });
  expect(fetch.mock.calls[0][0]).toBe('https://example.invalid/v1/chat/completions');
  expect(JSON.parse(fetch.mock.calls[0][1].body)).not.toHaveProperty('chat_template_kwargs');
  expect(result.text).toBe('Working.');
  expect(result.usage).toMatchObject({ inputTokens: 3, outputTokens: 2, totalTokens: 5 });
});
