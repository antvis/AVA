/**
 * Data source loaders: turn a DataSourceConfig into a LoadedSource
 * that the engine registers as the `data` view.
 */

import { loadCSV } from './csv';
import { loadObject } from './object';
import { loadURL } from './url';
import { loadText } from './text';
import { loadMySQL } from './mysql';
import { loadPostgreSQL } from './postgresql';
import { loadCSVFile, loadJSONFile, loadParquetFile } from './file';

import type { DataSourceConfig, LLMConfig, LoadedSource } from '../../types';

export type { LoadedSource } from '../../types';

/** Load a data source config into a LoadedSource the engine can register. */
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
    case 'postgresql':
      return loadPostgreSQL(config.options);
  }
}
