/**
 * Data source loaders: turn a DataSourceConfig into a LoadedSource
 * that the engine registers as one or more views.
 */

import { loadCSV } from './csv';
import { loadCSVFile } from './csv-file';
import { loadExcel } from './excel';
import { loadJson } from './json';
import { loadJSONFile } from './json-file';
import { loadMySQL } from './mysql';
import { loadParquetFile } from './parquet';
import { loadPostgreSQL } from './postgresql';
import { loadText } from './text';

import type { DataSourceConfig, LLMConfig, LoadedSource } from '../../types';

export type { LoadedSource } from '../../types';

/**
 * Load a data source config into a LoadedSource the engine can register.
 */
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
    case 'excel':
      return loadExcel(config.options);
    case 'mysql':
      return loadMySQL(config.options);
    case 'postgresql':
      return loadPostgreSQL(config.options);
    case 'supabase':
      // Supabase is a SaaS source executed remotely — AVA routes it to
      // SupabaseEngine, so it must never reach the DuckDB loaders
      throw new Error('Supabase sources are handled by SupabaseEngine, not the DuckDB engine');
  }
}
