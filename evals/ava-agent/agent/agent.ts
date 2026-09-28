import { defineAgent } from 'eve';
import { createOpenAI } from '@ai-sdk/openai';

const model = process.env.OPENAI_MODEL?.trim();
const apiKey = process.env.OPENAI_API_KEY?.trim();
const baseURL = process.env.OPENAI_BASE_URL?.trim();

if (!model || !apiKey || !baseURL) {
  throw new Error('OPENAI_MODEL, OPENAI_API_KEY, and OPENAI_BASE_URL are all required.');
}

const provider = createOpenAI({ apiKey, baseURL });

export default defineAgent({
  model: provider.chat(model),
  defaultTools: false,
  modelContextWindowTokens: Number(process.env.MODEL_CONTEXT_WINDOW ?? 128000),
  limits: {
    maxInputTokensPerSession: 200000,
    maxOutputTokensPerSession: 24000,
  },
});
