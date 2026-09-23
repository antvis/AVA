import { createGateway } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { LanguageModel } from 'ai';
import type { LLMConfig } from '../types';

/** Keep OpenAI-compatible endpoints on Chat Completions after the SDK upgrade. */
export function languageModel(llm: LLMConfig): LanguageModel {
  if (llm.provider === 'gateway') {
    return createGateway({ apiKey: llm.apiKey, baseURL: llm.baseURL })(llm.model);
  }
  return createOpenAI({ apiKey: llm.apiKey, baseURL: llm.baseURL }).chat(llm.model);
}
