/**
 * JSON loader: validate an in-memory object array.
 */

import type { JsonSourceOptions } from '../../types';

export async function loadJson(options: JsonSourceOptions): Promise<any[]> {
  const { data } = options;

  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  if (
    data.length > 0 &&
    !data.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item))
  ) {
    throw new Error('All items in the array must be plain objects');
  }

  return data;
}
