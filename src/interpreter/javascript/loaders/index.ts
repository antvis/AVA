/**
 * Data source loaders for the JavaScript interpreter engine.
 */

import { loadCSV } from './csv';
import { loadJson } from './json';
import { loadText } from './text';

import type { DataSourceConfig } from '../../../contracts';
import type { LLMConfig } from '../../../config';

export type InterpreterSourceConfig = Extract<DataSourceConfig, { type: 'csv' | 'json' | 'text' }>;

export async function loadSource(config: InterpreterSourceConfig, llmConfig: LLMConfig): Promise<any[]> {
  switch (config.type) {
    case 'csv':
      return loadCSV(config.options);
    case 'json':
      return loadJson(config.options);
    case 'text':
      return loadText(config.options, llmConfig);
    default:
      throw new Error(`Unsupported source type for JavaScript interpreter engine: ${(config as any).type}`);
  }
}
