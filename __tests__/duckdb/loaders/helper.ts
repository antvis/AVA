/**
 * Shared helper for loader tests: register a LoadedSource onto an in-memory
 * DuckDB instance and read back the rows from the data view.
 */

import { DuckDBInstance } from '@duckdb/node-api';

import { coerceNumbers } from '../../../src/util/coerce';

import type { LoadedSource } from '../../../src/types';

/**
 * Register the source as the `data` view on a fresh in-memory DuckDB and
 * return its rows. The caller is responsible for `source.cleanup()`.
 */
export async function registerAndQuery(source: LoadedSource): Promise<any[]> {
  const instance = await DuckDBInstance.create(':memory:');
  const conn = await instance.connect();
  try {
    await source.register(conn, 'data');
    const reader = await conn.runAndReadAll('SELECT * FROM data');
    return coerceNumbers(reader.getRowObjectsJson());
  } finally {
    conn.closeSync();
    instance.closeSync();
  }
}
