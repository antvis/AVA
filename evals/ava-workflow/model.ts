import { readModelEnv } from '../_shared/model-env.js';
import { createOpenAI } from '@ai-sdk/openai';
import type { LLMConfig } from '../../lib/index.js';

export const modelOptions = {
  thinking: { type: 'string', default: 'provider' },
  temperature: { type: 'string' },
  'max-output-tokens': { type: 'string' },
} as const;

type Options = { thinking?: string; temperature?: string; 'max-output-tokens'?: string };

export function modelSettings(options: Options = {}) {
  const thinking = options.thinking ?? 'provider';
  if (!['provider', 'on', 'off'].includes(thinking)) throw new Error('--thinking must be provider, on or off');
  const temperature = options.temperature === undefined ? undefined : Number(options.temperature);
  const maxOutputTokens = options['max-output-tokens'] === undefined ? undefined : Number(options['max-output-tokens']);
  if (temperature !== undefined && (!Number.isFinite(temperature) || temperature < 0 || temperature > 2)) {
    throw new Error('--temperature must be between 0 and 2');
  }
  if (maxOutputTokens !== undefined && (!Number.isSafeInteger(maxOutputTokens) || maxOutputTokens < 1)) {
    throw new Error('--max-output-tokens must be a positive integer');
  }
  return { thinking, temperature, maxOutputTokens };
}

export function llmConfig(options: Options = {}): LLMConfig & { baseURL: string } {
  const { thinking, temperature, maxOutputTokens } = modelSettings(options);
  const { OPENAI_API_KEY: apiKey, OPENAI_MODEL: model, OPENAI_BASE_URL: baseURL } = readModelEnv();
  const provider = createOpenAI({
    apiKey,
    baseURL,
    ...(thinking === 'provider' ? {} : {
      fetch: (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
        fetch(input, {
          ...init,
          body: JSON.stringify({
            ...JSON.parse(init!.body as string),
            chat_template_kwargs: { enable_thinking: thinking === 'on' },
          }),
        }),
    }),
  });
  return { apiKey, model: provider.chat(model), baseURL, temperature, maxOutputTokens };
}
