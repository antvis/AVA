import { createGateway, generateText as sdkGenerateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { safeModelError } from './error';

import type { LanguageModel } from 'ai';
import type { LLMConfig } from '../types';

/** Keep OpenAI-compatible endpoints on Chat Completions after the SDK upgrade. */
export function languageModel(llm: LLMConfig): Exclude<LanguageModel, string> {
  try {
    if (typeof llm.model !== 'string') return llm.model;
    if (llm.provider === 'gateway') {
      return createGateway({ apiKey: llm.apiKey, baseURL: llm.baseURL })(llm.model);
    }
    return createOpenAI({ apiKey: llm.apiKey, baseURL: llm.baseURL }).chat(llm.model);
  } catch (error) {
    throw safeModelError(error);
  }
}

/** Keep the SDK's generic inference while normalizing provider failures at one request boundary. */
export const generateText: typeof sdkGenerateText = async (options) => {
  try {
    return await sdkGenerateText(options);
  } catch (error) {
    throw safeModelError(error);
  }
};
