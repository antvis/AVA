/**
 * Shared LLM configuration for the test suites.
 *
 * `vitest.setup.ts` loads `.env` before the test files are evaluated, so the values read here
 * are already populated at import time. When no key is configured, the LLM-dependent suites
 * declare `describe.skipIf(skipLLMTests)` and are reported as skipped instead of silently passing.
 */

import type { LLMConfig } from '../src/types';

const apiKey = process.env.OPENAI_LLM_API_KEY;

/** True when no API key is configured — LLM-dependent suites skip themselves. */
export const skipLLMTests = !apiKey;

/** LLM config for the provider configured in `.env`. */
export function getLLMConfig(): LLMConfig {
  return {
    model: process.env.OPENAI_LLM_MODEL || '',
    apiKey: apiKey || '',
    baseURL: process.env.OPENAI_LLM_BASE_URL || '',
  };
}
