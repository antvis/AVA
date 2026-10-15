import { createOpenAI } from '@ai-sdk/openai';
import type { LLMConfig } from '@antv/ava/browser';

export function createModel(config: LLMConfig) {
  return typeof config.model !== 'string'
    ? config.model
    : createOpenAI({ apiKey: config.apiKey, baseURL: config.baseURL }).chat(config.model);
}
