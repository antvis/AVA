/**
 * Data source loaders: turn a DataSourceConfig into a LoadedSource
 * (a local file + format) that DuckDB registers as the `data` view.
 */

import { loadCSV } from './csv';
import { loadObject } from './object';
import { loadURL } from './url';
import { loadText } from './text';
import { loadMySQL } from './mysql';
import { loadCSVFile, loadJSONFile, loadParquetFile } from './file';

import type { DataSourceConfig, LLMConfig, LoadedSource } from '../../types';

export type { LoadedSource } from '../../types';

/**
 * Load a data source config into a LoadedSource the engine can register.
 * @throws Error for reserved/unsupported source types (postgresql)
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
    case 'mysql':
      return loadMySQL(config.options);
    default:
      throw new Error(`loadSource: "${config.type}" sources are not supported yet.`);
  }
}
