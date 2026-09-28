import { DuckDBInstance } from '@duckdb/node-api';

import type { CSVReadOptions, LLMConfig } from '../../src/types';

// Never read developer credentials or invoke an LLM in these tests.
export const OFFLINE_LLM: LLMConfig = { model: 'unused-in-duckdb-tests' };
export const LENIENT_CSV_OPTIONS: CSVReadOptions = {
  encoding: 'utf-8',
  header: true,
  ignore_errors: true,
  null_padding: false,
  skip: 0,
  strict_mode: false,
};

// Independent native-driver oracle: read the driver's JSON representation
// without SQL wrapping, row caps, number coercion or profile post-processing.
// Only caller-owned fixtures and constant SELECTs are used here.
export async function nativeQuery(sql: string) {
  const instance = await DuckDBInstance.create(':memory:', {
    autoinstall_known_extensions: 'false',
    autoload_known_extensions: 'false',
  });
  try {
    const connection = await instance.connect();
    try {
      const reader = await connection.runAndReadAll(sql);
      return {
        data: reader.getRowObjectsJson(),
        schema: Array.from({ length: reader.columnCount }, (_, index) => ({
          name: reader.columnName(index),
          type: reader.columnType(index).toString(),
        })),
      };
    } finally {
      connection.closeSync();
    }
  } finally {
    instance.closeSync();
  }
}
