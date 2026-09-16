/**
 * Data source loaders: turn a DataSourceConfig into a LoadedSource
 * (a local file + format) that DuckDB registers as the `data` view.
 */

import { loadCSV } from './csv';
import { loadObject } from './object';
import { loadURL } from './url';
import { loadText } from './text';
import { loadCSVFile, loadJSONFile, loadParquetFile } from './file';

import type { DataSourceConfig, LLMConfig, LoadedSource } from '../../types';

export type { LoadedSource } from '../../types';

/**
 * Load a data source config into a local file that DuckDB can read.
 * @throws Error for reserved/unsupported source types (mysql, postgresql)
 */
export async function loadSource(config: DataSourceConfig, llmConfig: LLMConfig): Promise<LoadedSource> {
  switch (config.type) {
    case 'csv':
      return loadCSV(config.options);
    case 'object':
      return loadObject(config.options);
    case 'url':
      return loadURL(config.options);
    case 'text':
      return loadText(config.options, llmConfig);
    case 'csv-file':
      return loadCSVFile(config.options);
    case 'json':
      return loadJSONFile(config.options);
    case 'parquet':
      return loadParquetFile(config.options);
    // Database sources are reserved and not implemented yet
    default:
      throw new Error(`loadSource: "${config.type}" sources are not supported yet.`);
  }
}
