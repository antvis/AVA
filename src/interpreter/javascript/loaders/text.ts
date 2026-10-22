/** Extract structured records from text for the JavaScript interpreter. */

import { extractTextData } from '../../../util/text';

import type { LLMConfig, TextSourceOptions } from '../../../types';

export async function loadText(options: TextSourceOptions, llmConfig: LLMConfig): Promise<any[]> {
  return extractTextData(options.text, llmConfig);
}
