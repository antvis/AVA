/**
 * Data source loaders for the interpreter engine.
 */

import { loadCSV } from './csv';
import { loadJson } from './json';
import { loadText } from './text';

import type { CSVSourceOptions, JsonSourceOptions, LLMConfig, TextSourceOptions } from '../../types';

export type InterpreterSourceConfig =
  | { type: 'csv'; options: CSVSourceOptions }
  | { type: 'json'; options: JsonSourceOptions }
  | { type: 'text'; options: TextSourceOptions };

export async function loadSource(
  config: InterpreterSourceConfig,
  llmConfig: LLMConfig,
): Promise<any[]> {
  switch (config.type) {
    case 'csv':
      return loadCSV(config.options);
    case 'json':
      return loadJson(config.options);
    case 'text':
      return loadText(config.options, llmConfig);
    default:
      throw new Error(`Unsupported source type for interpreter engine: ${(config as any).type}`);
  }
}
