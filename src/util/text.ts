import { generateText, Output } from 'ai';
import { z } from 'zod';

import { languageModel } from './model';

import type { LLMConfig } from '../types';

const extractedDataSchema = z.object({ rows: z.array(z.record(z.unknown())) });

/** Extract records with dynamic columns while preserving nested JSON values. */
export async function extractTextData(text: string, llmConfig: LLMConfig): Promise<Record<string, unknown>[]> {
  const { output } = await generateText({
    model: languageModel(llmConfig),
    maxRetries: llmConfig.maxRetries ?? 3,
    output: Output.json(),
    system: `You are a data extraction assistant. Extract structured data from the user's text.

The text may contain data in various formats (comma-separated, space-separated, tabular, etc.). Your task is to:
1. Identify the structure and pattern in the data.
2. Extract all data points as records with meaningful column names.
3. Ensure all records have the same keys (columns).
4. Preserve nested objects, arrays, nulls and scalar values in fields.
5. Return a JSON object with a "rows" array of records, for example {"rows":[{"city":"Beijing","value":100}]}.

Return ONLY valid JSON, with double-quoted keys and strings and no Markdown or explanation.
If there are no records, return {"rows":[]}.`,
    prompt: text,
  });
  return extractedDataSchema.parse(output).rows;
}
