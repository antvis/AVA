/**
 * JSON loader: validate an in-memory object array and write it to a temp JSON
 * file for DuckDB to read.
 */

import { fileSource, removeTempFile, writeTempFile } from '../util/file';

import type { JsonSourceOptions, LoadedSource } from '../../types';

export async function loadJson(options: JsonSourceOptions): Promise<LoadedSource> {
  const { data } = options;

  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  if (data.length > 0 && !data.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item))) {
    throw new Error('All items in the array must be plain objects');
  }

  const tmpFile = await writeTempFile(JSON.stringify(data), 'json');
  return fileSource(tmpFile, 'json', () => removeTempFile(tmpFile));
}
