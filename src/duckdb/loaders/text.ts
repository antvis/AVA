/** Extract structured records from text and load them with DuckDB's JSON reader. */

import { extractTextData } from '../../util/text';

import { loadJson } from './json';

import type { LLMConfig, TextSourceOptions, LoadedSource } from '../../types';

export async function loadText(options: TextSourceOptions, llmConfig: LLMConfig): Promise<LoadedSource> {
  const data = await extractTextData(options.text, llmConfig);
  return loadJson({ data });
}
