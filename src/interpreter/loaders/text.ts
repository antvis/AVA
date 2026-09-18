/**
 * Text loader: extract structured data from unstructured text via LLM.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { LLMConfig, TextSourceOptions } from '../../types';

export async function loadText(options: TextSourceOptions, llmConfig: LLMConfig): Promise<any[]> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const prompt = `You are a data extraction assistant. Extract structured data from the following text and return it as a JSON array of objects.

The text may contain data in various formats (comma-separated, space-separated, tabular, etc.). Your task is to:
1. Identify the structure and pattern in the data
2. Extract all data points
3. Return a JSON array where each element is an object with appropriate key-value pairs
4. Ensure all objects have the same keys (columns)
5. Use meaningful key names based on the context

Text to analyze:
${options.text}

Return ONLY the JSON array, no additional text or explanation. The response must be valid JSON that can be parsed directly.`;

  const { text: responseText } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  try {
    const data = JSON.parse(responseText);
    if (Array.isArray(data)) return data;
  } catch {
    // Fall through to regex extraction
  }

  const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON array from LLM response');
  }

  const data = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(data)) {
    throw new Error('LLM did not return an array');
  }
  return data;
}
