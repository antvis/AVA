/**
 * Unit tests for src/duckdb/loaders/csv-file.ts
 */

import * as path from 'path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { writeTempFile, removeTempFile } from '../../../src/duckdb/util/file';
import { getLLMConfig } from '../../test-utils';

describe('loaders/csv-file', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads the sales CSV with a complete schema and original column order', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const csvPath = path.join(__dirname, '../../datasets/sales.csv');
    await engine.load({ type: 'csv-file', options: { path: csvPath } });
    const schema = await engine.schema();

    expect(schema).toEqual({
      models: [
        {
          name: 'data',
          columns: [
            { name: 'order_id', type: 'VARCHAR', notNull: false },
            { name: 'order_date', type: 'DATE', notNull: false },
            { name: 'region', type: 'VARCHAR', notNull: false },
            { name: 'category', type: 'VARCHAR', notNull: false },
            { name: 'product', type: 'VARCHAR', notNull: false },
            { name: 'channel', type: 'VARCHAR', notNull: false },
            { name: 'quantity', type: 'BIGINT', notNull: false },
            { name: 'unit_price', type: 'DOUBLE', notNull: false },
            { name: 'discount', type: 'DOUBLE', notNull: false },
            { name: 'sales', type: 'DOUBLE', notNull: false },
            { name: 'cost', type: 'DOUBLE', notNull: false },
            { name: 'profit', type: 'DOUBLE', notNull: false },
          ],
          tableReference: { catalog: 'memory', schema: 'main', table: 'data' },
        },
      ],
      relationships: [],
      views: schema.models.map(({ name }) => ({ name, statement: expect.any(String) })),
    });
  });

  it('passes reader options (delim) through to read_csv', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const localPath = path.join(__dirname, '../../../data/semicolon.csv');
    await engine.load({ type: 'csv-file', options: { path: localPath, options: { delim: ';' } } });

    const rows = await engine.execute('SELECT * FROM "data" ORDER BY name');
    expect(rows.data).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);
  });

  it('returns an empty table for unmatched files only when allow_empty is enabled', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'ava-empty-csv-'));
    try {
      engine = new DuckDBEngine(getLLMConfig());
      const options = { path: path.join(directory, '*.csv') };
      await expect(engine.load({ type: 'csv-file', options })).rejects.toThrow();
      await engine.load({ type: 'csv-file', options: { ...options, options: { allow_empty: true } } });
      expect((await engine.schema()).models[0].columns).toEqual([{ name: 'empty', type: 'BOOLEAN', notNull: false }]);
      expect((await engine.execute('SELECT * FROM data')).data).toEqual([]);
    } finally {
      await engine?.dispose();
      engine = null;
      await rm(directory, { recursive: true, force: true });
    }
  });

  it.each([4, 0])('limits rejected CSV line text to %s characters (0 is unlimited)', async (limit) => {
    const file = await writeTempFile('id\n1\ninvalid-long-line\n2\n', 'csv');
    try {
      engine = new DuckDBEngine(getLLMConfig());
      await engine.load({
        type: 'csv-file',
        options: {
          path: file,
          options: { header: true, columns: { id: 'INTEGER' }, store_rejects: true, rejects_line_size_limit: limit },
        },
      });
      expect((await engine.execute('SELECT * FROM data ORDER BY id')).data).toEqual([{ id: 1 }, { id: 2 }]);
      expect((await engine.execute('SELECT csv_line FROM reject_errors')).data).toEqual([
        { csv_line: limit ? 'inva' : 'invalid-long-line' },
      ]);
    } finally {
      await engine?.dispose();
      engine = null;
      await removeTempFile(file);
    }
  });

  it('reads GB18030 Chinese with automatic extension loading disabled', async () => {
    // GB18030 bytes for "name\n中文\n".
    const csvPath = await writeTempFile(Buffer.from('6e616d650ad6d0cec40a', 'hex'), 'csv');
    try {
      engine = new DuckDBEngine(getLLMConfig());
      await engine.load({ type: 'csv-file', options: { path: csvPath, options: { encoding: 'gb18030' } } });
      const rows = await engine.execute('SELECT * FROM "data"');
      expect(rows.data).toEqual([{ name: '中文' }]);
    } finally {
      await engine?.dispose();
      engine = null;
      await removeTempFile(csvPath);
    }
  });
});
