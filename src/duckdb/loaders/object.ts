/**
 * Object loader: validate an in-memory array and write it to a temp JSON file
 * for DuckDB to read.
 */

import { removeTempFile, writeTempFile } from '../../util/file';

import type { ObjectSourceOptions, LoadedSource } from '../../types';

export async function loadObject(options: ObjectSourceOptions): Promise<LoadedSource> {
  const { data } = options;

  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  if (data.length > 0 && !data.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item))) {
    throw new Error('All items in the array must be plain objects');
  }

  const tmpFile = await writeTempFile(JSON.stringify(data), 'json');
  return { path: tmpFile, format: 'json', cleanup: () => removeTempFile(tmpFile) };
}
