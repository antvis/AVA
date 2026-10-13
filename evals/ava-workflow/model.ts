import { readModelEnv } from '../_shared/model-env.js';
import { createOpenAI } from '@ai-sdk/openai';
import type { LLMConfig } from '../../lib/index.js';

export function llmConfig(): LLMConfig & { baseURL: string } {
  const { OPENAI_API_KEY: apiKey, OPENAI_MODEL: model, OPENAI_BASE_URL: baseURL } = readModelEnv();
  const provider = createOpenAI({
    apiKey,
    baseURL,
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        body: JSON.stringify({
          ...JSON.parse(init!.body as string),
          chat_template_kwargs: { enable_thinking: false },
        }),
      }),
  });
  return {
    apiKey,
    model: provider.chat(model),
    baseURL,
  };
}
