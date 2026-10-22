/**
 * Unit tests for src/duckdb/loaders/csv.ts
 */

import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('loaders/csv', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('registers CSV content as a queryable view', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'csv', options: { csv: 'name,age\nAlice,30\nBob,25' } });

    const rows = await engine.execute('SELECT * FROM "data"');
    expect(rows.data).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);
  });

  it('preserves raw values and headers when all_varchar is requested', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'csv',
      options: {
        csv: '"code,id",value,note\r\n001,9007199254740993,"a,b"\r\n002,,"line 1\nline 2"',
        options: { header: true, all_varchar: true },
      },
    });
    expect((await engine.execute('SELECT * FROM data')).data).toEqual([
      { 'code,id': '001', value: '9007199254740993', note: 'a,b' },
      { 'code,id': '002', value: null, note: 'line 1\nline 2' },
    ]);
  });

  it('uses native delimiter, header and column type options on the original content', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'csv',
      options: {
        csv: '001;9007199254740993\n002;7',
        options: { delim: ';', header: false, columns: { code: 'VARCHAR', amount: 'BIGINT' } },
      },
    });
    expect((await engine.execute('SELECT code, amount::VARCHAR AS amount FROM data')).data).toEqual([
      { code: '001', amount: '9007199254740993' },
      { code: '002', amount: '7' },
    ]);
  });
});
