/** Inline CSV loader: let DuckDB parse the original content with read_csv. */

import { fileSource, removeTempFile, writeTempFile } from '../util/file';

import type { CSVSourceOptions, LoadedSource } from '../../types';

export async function loadCSV({ csv, options }: CSVSourceOptions): Promise<LoadedSource> {
  const tmpFile = await writeTempFile(csv, 'csv');
  return fileSource(tmpFile, 'csv', () => removeTempFile(tmpFile), options);
}
