import * as path from 'path';

import type { DataSourceConfig } from '../types';

export function sourceConfig(source: string, type?: string): DataSourceConfig {
  const inferred = path.extname(source).toLowerCase();
  const sourceType = type ?? ({ '.csv': 'csv-file', '.json': 'json-file', '.parquet': 'parquet', '.xls': 'excel', '.xlsx': 'excel' }[inferred]);

  switch (sourceType) {
    case 'csv-file': return { type: sourceType, options: { path: source } };
    case 'json-file': return { type: sourceType, options: { path: source } };
    case 'parquet': return { type: sourceType, options: { path: source } };
    case 'excel': return { type: sourceType, options: { path: source } };
    default: throw new Error(`Cannot infer the source type for "${source}". Pass --type.`);
  }
}
