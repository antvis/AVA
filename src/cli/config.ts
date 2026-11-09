import type { LLMConfig } from '../types';

export function llmConfig(required = false): LLMConfig {
  const { OPENAI_API_KEY: apiKey, OPENAI_MODEL: model, OPENAI_BASE_URL: baseURL } = process.env;

  if (required && !apiKey) throw new Error('Set OPENAI_API_KEY for this command.');

  return { model: model || 'gpt-4o-mini', ...(apiKey ? { apiKey } : {}), ...(baseURL ? { baseURL } : {}) };
}
