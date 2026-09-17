/**
 * Shared helper for loader tests: register a LoadedSource onto an in-memory
 * DuckDB instance and read back the rows from the data view.
 */

import { DuckDBInstance } from '@duckdb/node-api';

import { coerceNumbers } from '../../../src/util/coerce';

import type { LoadedSource } from '../../../src/types';

/**
 * Register the source on a fresh in-memory DuckDB and read back the rows from
 * its first registered view. The caller is responsible for `source.cleanup()`.
 */
export async function registerAndQuery(source: LoadedSource): Promise<any[]> {
  const instance = await DuckDBInstance.create(':memory:');
  const conn = await instance.connect();
  try {
    const tableNames = await source.register(conn);
    const reader = await conn.runAndReadAll(`SELECT * FROM "${tableNames[0]}"`);
    return coerceNumbers(reader.getRowObjectsJson());
  } finally {
    conn.closeSync();
    instance.closeSync();
  }
}
