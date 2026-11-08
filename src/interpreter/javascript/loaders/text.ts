/**
 * Text loader: extract structured data from unstructured text via LLM.
 */

import { AVAError } from '../../../util/error';
import { generateText, languageModel } from '../../../util/model';

import type { LLMConfig, TextSourceOptions } from '../../../types';

export async function loadText(options: TextSourceOptions, llmConfig: LLMConfig): Promise<any[]> {
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
    model: languageModel(llmConfig),
    maxRetries: llmConfig.maxRetries ?? 3,
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
    throw new AVAError('MODEL_ERROR', 'Could not extract JSON array from LLM response');
  }

  let data: unknown;
  try {
    data = JSON.parse(jsonMatch[0]);
  } catch {
    throw new AVAError('MODEL_ERROR', 'The model returned invalid extracted data JSON.');
  }
  if (!Array.isArray(data)) {
    throw new AVAError('MODEL_ERROR', 'LLM did not return an array');
  }
  return data;
}
