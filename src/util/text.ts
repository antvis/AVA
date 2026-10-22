import { generateText } from 'ai';
import { z } from 'zod';

import { languageModel } from './model';

import type { LLMConfig } from '../types';

const extractedDataSchema = z.array(z.record(z.unknown()));

/** Extract records with dynamic columns while preserving nested JSON values. */
export async function extractTextData(text: string, llmConfig: LLMConfig): Promise<Record<string, unknown>[]> {
  const { text: responseText } = await generateText({
    model: languageModel(llmConfig),
    maxRetries: llmConfig.maxRetries ?? 3,
    system: `You are a data extraction assistant. Extract structured data from the user's text.

The text may contain data in various formats (comma-separated, space-separated, tabular, etc.). Your task is to:
1. Identify the structure and pattern in the data.
2. Extract all data points.
3. Return a JSON array where each element is an object with appropriate key-value pairs.
4. Ensure all objects have the same keys (columns).
5. Use meaningful key names based on the context.
6. Preserve nested objects, arrays, nulls and scalar values in fields.

Return ONLY the JSON array, no additional text or explanation. The response must be valid JSON.
If there are no records, return [].`,
    prompt: text,
  });
  const json = responseText.trim().replace(/^```(?:json)?[ \t]*\r?\n([\s\S]*)\r?\n```$/i, '$1');
  return extractedDataSchema.parse(JSON.parse(json));
}
