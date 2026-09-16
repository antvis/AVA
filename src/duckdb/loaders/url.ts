/**
 * URL loader: fetch JSON from a URL, optionally transform it into an array,
 * then write it to a temp JSON file for DuckDB to read.
 */

import { removeTempFile, writeTempFile } from '../../util/file';

import type { URLSourceOptions, LoadedSource } from '../../types';

export async function loadURL(options: URLSourceOptions): Promise<LoadedSource> {
  const { url, transform } = options;

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`Failed to fetch from URL: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(`Response is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  const result = transform ? transform(data) : data;
  if (!Array.isArray(result)) {
    throw new Error('Result must be an array. Use transform function to extract array from response.');
  }

  const tmpFile = await writeTempFile(JSON.stringify(result), 'json');
  return { path: tmpFile, format: 'json', cleanup: () => removeTempFile(tmpFile) };
}
