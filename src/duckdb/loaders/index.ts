/**
 * Data source loaders: turn a DataSourceConfig into a LoadedSource
 * that the engine registers as one or more views.
 */

import { loadCSV } from './csv';
import { loadCSVFile } from './csv-file';
import { loadJson } from './json';
import { loadJSONFile } from './json-file';
import { loadParquetFile } from './parquet';
import { loadText } from './text';
import { loadMySQL } from './mysql';
import { loadPostgreSQL } from './postgresql';

import type { DataSourceConfig, LLMConfig, LoadedSource } from '../../types';

export type { LoadedSource } from '../../types';

/** Load a data source config into a LoadedSource the engine can register. */
export async function loadSource(config: DataSourceConfig, llmConfig: LLMConfig): Promise<LoadedSource> {
  switch (config.type) {
    case 'csv':
      return loadCSV(config.options);
    case 'json':
      return loadJson(config.options);
    case 'text':
      return loadText(config.options, llmConfig);
    case 'csv-file':
      return loadCSVFile(config.options);
    case 'json-file':
      return loadJSONFile(config.options);
    case 'parquet':
      return loadParquetFile(config.options);
    case 'mysql':
      return loadMySQL(config.options);
    case 'postgresql':
      return loadPostgreSQL(config.options);
  }
}
