import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createOpenAI } from '@ai-sdk/openai';
import type { LLMConfig } from '../../lib/index.js';

export function llmConfig(): LLMConfig {
  const envPath = fileURLToPath(new URL('./.env', import.meta.url));
  if (existsSync(envPath)) process.loadEnvFile(envPath);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  const baseURL = process.env.OPENAI_BASE_URL;
  if (!apiKey || !model) throw new Error('Set OPENAI_API_KEY and OPENAI_MODEL in evals/ava-workflow/.env.');
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
    ...(baseURL ? { baseURL } : {}),
  };
}
