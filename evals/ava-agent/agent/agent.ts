import { defineAgent } from 'eve';
import { createOpenAI } from '@ai-sdk/openai';

const provider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export default defineAgent({
  model: provider.chat(process.env.OPENAI_MODEL!),
  defaultTools: false,
  modelContextWindowTokens: Number(process.env.MODEL_CONTEXT_WINDOW ?? 128000),
  limits: {
    maxInputTokensPerSession: 200000,
    maxOutputTokensPerSession: 24000,
  },
});
