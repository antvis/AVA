/**
 * Text data extraction functionality using LLM
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { LLMConfig } from '../types';

/**
 * Extract structured data from text using LLM
 * @param text - Text to extract structured data from
 * @param llmConfig - LLM configuration for data extraction
 * @returns Promise resolving to extracted structured data as array of objects
 * @throws Error if LLM fails to extract data or returns invalid JSON
 * @example
 * ```typescript
 * const llmConfig = { model: 'gpt-4', apiKey: 'key', baseURL: 'url' };
 * const data = await loadText('Beijing 100, Shanghai 200, Hangzhou 300', llmConfig);
 * // Returns: [{ city: 'Beijing', value: 100 }, ...]
 * ```
 */
export async function loadText(text: string, llmConfig: LLMConfig): Promise<any[]> {
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
${text}

Return ONLY the JSON array, no additional text or explanation. The response must be valid JSON that can be parsed directly.`;

  const { text: responseText } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  // Try parsing the entire response first
  try {
    const data = JSON.parse(responseText);
    if (Array.isArray(data)) {
      return data;
    }
  } catch {
    // If direct parsing fails, try to extract JSON array from response
  }

  // Extract JSON array using non-greedy regex
  const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON array from LLM response');
  }
  
  try {
    const data = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(data)) {
      throw new Error('LLM did not return an array');
    }
    
    return data;
  } catch (error) {
    throw new Error(
      `Failed to parse extracted JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
