/**
 * Unit tests for src/duckdb/loaders/csv-file.ts
 */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { loadCSVFile } from '../../../src/duckdb/loaders/csv-file';
import { CSV_READ_OPTION_CASES as OPTIONS } from '../../fixtures/csv-read-options';
import { getLLMConfig } from '../../test-utils';
import { OFFLINE_LLM, LENIENT_CSV_OPTIONS } from '../test-utils';

import type { DuckDBConnection } from '../../../src/types';

describe('loaders/csv-file', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
    vi.unstubAllGlobals();
  });

  it('loads the sales CSV with a complete schema and original column order', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const csvPath = path.join(__dirname, '../../datasets/sales.csv');
    const schema = await engine.load({ type: 'csv-file', options: { path: csvPath } });

    expect(schema).toEqual({
      tables: [
        {
          name: 'data',
          columnCount: 12,
          fields: [
            { name: 'order_id', type: 'VARCHAR', nullable: true },
            { name: 'order_date', type: 'DATE', nullable: true },
            { name: 'region', type: 'VARCHAR', nullable: true },
            { name: 'category', type: 'VARCHAR', nullable: true },
            { name: 'product', type: 'VARCHAR', nullable: true },
            { name: 'channel', type: 'VARCHAR', nullable: true },
            { name: 'quantity', type: 'BIGINT', nullable: true },
            { name: 'unit_price', type: 'DOUBLE', nullable: true },
            { name: 'discount', type: 'DOUBLE', nullable: true },
            { name: 'sales', type: 'DOUBLE', nullable: true },
            { name: 'cost', type: 'DOUBLE', nullable: true },
            { name: 'profit', type: 'DOUBLE', nullable: true },
          ],
          indexes: [],
        },
      ],
      relations: [],
    });
  });

  it('downloads a remote file and registers it as a queryable view', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => new TextEncoder().encode('a,b\n1,2').buffer,
      }))
    );

    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'csv-file', options: { path: 'https://example.com/data.csv' } });

    const rows = await engine.execute('SELECT * FROM "data"');
    expect(rows.data).toEqual([{ a: 1, b: 2 }]);
  });
});

// Verify reader options against actual parsed rows using the local DuckDB reader.
describe('CSV file parsing and read options', () => {
  let engine: DuckDBEngine;
  let directory: string;
  let csvPath: string;
  beforeEach(async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw new Error('Network forbidden in local CSV tests');
      })
    );
    engine = new DuckDBEngine(OFFLINE_LLM);
    directory = await mkdtemp(path.join(tmpdir(), 'ava-csv-test-'));
    csvPath = path.join(directory, 'source.csv');
  });
  afterEach(async () => {
    try {
      await engine?.dispose();
    } finally {
      vi.unstubAllGlobals();
      if (directory) await rm(directory, { recursive: true, force: true });
    }
  });

  it('parses a semicolon-delimited file using the delim option', async () => {
    const localPath = path.join(__dirname, '../../../data/semicolon.csv');
    await engine.load({ type: 'csv-file', options: { path: localPath, options: { delim: ';' } } });

    const rows = await engine.execute('SELECT * FROM "data" ORDER BY name');
    expect(rows.data).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);
  });

  it.each([',', ';', '\t', '|'])('auto-detects %j without injecting a literal auto delimiter', async (delim) => {
    await writeFile(csvPath, `name${delim}city\nAlice${delim}Hangzhou\nBob${delim}Shanghai\n`);
    await engine.load({ type: 'csv-file', options: { path: csvPath, options: LENIENT_CSV_OPTIONS } });
    expect((await engine.execute('SELECT * FROM data ORDER BY name')).data).toEqual([
      { name: 'Alice', city: 'Hangzhou' },
      { name: 'Bob', city: 'Shanghai' },
    ]);
  });

  it.each(['\n', '\r\n', '\r'])(
    'preserves quoted delimiters, escaped quotes and embedded newline with %j',
    async (eol) => {
      await writeFile(csvPath, `name,note${eol}Alice,"a,b"${eol}Bob,"say ""hello""${eol}next"${eol}`);
      await engine.load({
        type: 'csv-file',
        options: {
          path: csvPath,
          options: {
            ...LENIENT_CSV_OPTIONS,
            // DuckDB expects the literal escape spelling, not a raw newline here.
            new_line: eol.replace(/\r/g, '\\r').replace(/\n/g, '\\n'),
          },
        },
      });
      expect((await engine.execute('SELECT * FROM data ORDER BY name')).data).toEqual([
        { name: 'Alice', note: 'a,b' },
        { name: 'Bob', note: `say "hello"${eol}next` },
      ]);
    }
  );

  it('retains the first data row without headers and skips a preamble', async () => {
    await writeFile(csvPath, 'preamble\nAlice;Hangzhou\nBob;Shanghai');
    await engine.load({
      type: 'csv-file',
      options: {
        path: csvPath,
        options: {
          header: false,
          skip: 1,
          delim: ';',
          names: ['name', 'city'],
        },
      },
    });
    expect((await engine.execute('SELECT * FROM data ORDER BY name')).data).toEqual([
      { name: 'Alice', city: 'Hangzhou' },
      { name: 'Bob', city: 'Shanghai' },
    ]);
  });

  it.each([true, false])('distinguishes quoted NULL with allow_quoted_nulls=%s', async (allowQuotedNulls) => {
    await writeFile(csvPath, 'name,value\nAlice,NA\nBob,"NA"\nCarol,""\n');
    await engine.load({
      type: 'csv-file',
      options: {
        path: csvPath,
        options: {
          ...LENIENT_CSV_OPTIONS,
          all_varchar: true,
          nullstr: ['NA'],
          allow_quoted_nulls: allowQuotedNulls,
        },
      },
    });
    expect((await engine.execute('SELECT * FROM data ORDER BY name')).data).toEqual([
      { name: 'Alice', value: null },
      { name: 'Bob', value: allowQuotedNulls ? null : 'NA' },
      { name: 'Carol', value: '' },
    ]);
  });

  it('pads a short row only when requested', async () => {
    await writeFile(csvPath, 'name,city\nAlice,Hangzhou\nBob\n');
    await engine.load({
      type: 'csv-file',
      options: {
        path: csvPath,
        options: {
          header: true,
          auto_detect: false,
          delim: ',',
          strict_mode: false,
          null_padding: true,
          columns: { name: 'VARCHAR', city: 'VARCHAR' },
        },
      },
    });
    expect((await engine.execute('SELECT * FROM data ORDER BY name')).data).toEqual([
      { name: 'Alice', city: 'Hangzhou' },
      { name: 'Bob', city: null },
    ]);
  });

  it.each([true, false])('rejects or skips malformed rows with ignore_errors=%s', async (ignoreErrors) => {
    const loadAndRead = async () => {
      await writeFile(csvPath, 'name,city\nAlice,Hangzhou\nBad,too,many\nBob,Shanghai\n');
      await engine.load({
        type: 'csv-file',
        options: {
          path: csvPath,
          options: {
            header: true,
            columns: { name: 'VARCHAR', city: 'VARCHAR' },
            ignore_errors: ignoreErrors,
            strict_mode: true,
            null_padding: false,
          },
        },
      });
      return engine.execute('SELECT * FROM data ORDER BY name');
    };
    if (ignoreErrors) {
      expect((await loadAndRead()).data).toEqual([
        { name: 'Alice', city: 'Hangzhou' },
        { name: 'Bob', city: 'Shanghai' },
      ]);
    } else {
      await expect(loadAndRead()).rejects.toThrow();
    }
  });

  it('keeps full count separate from the five-row preview', async () => {
    await writeFile(csvPath, `name\n${Array.from({ length: 250 }, (_, i) => `person-${i}`).join('\n')}\n`);
    await engine.load({ type: 'csv-file', options: { path: csvPath, options: LENIENT_CSV_OPTIONS } });
    expect((await engine.execute('SELECT * FROM data LIMIT 5')).data).toHaveLength(5);
    // INTEGER deliberately isolates COUNT coverage from BIGINT string coercion.
    expect((await engine.execute('SELECT COUNT(*)::INTEGER AS n FROM data')).data).toEqual([{ n: 250 }]);
  });

  it('parses custom date/timestamp formats without losing microseconds', async () => {
    await writeFile(csvPath, 'date,time\n28/09/2026,28/09/2026 12:34:56.123456\n');
    await engine.load({
      type: 'csv-file',
      options: {
        path: csvPath,
        options: {
          header: true,
          dateformat: '%d/%m/%Y',
          timestampformat: '%d/%m/%Y %H:%M:%S.%f',
          columns: { date: 'DATE', time: 'TIMESTAMP' },
        },
      },
    });
    expect((await engine.execute('SELECT * FROM data')).data).toEqual([
      { date: '2026-09-28', time: '2026-09-28 12:34:56.123456' },
    ]);
  });

  it('preserves UTF-8 BOM handling and original file bytes across reads and dispose', async () => {
    const bytes = Buffer.from('\ufeffname\n中文\n');
    csvPath = path.join(directory, "source's file.csv");
    await writeFile(csvPath, bytes);
    const schema = await engine.load({ type: 'csv-file', options: { path: csvPath, options: LENIENT_CSV_OPTIONS } });
    expect(schema.tables[0].fields[0].name).toBe('name');
    expect((await engine.execute('SELECT * FROM data')).data).toEqual([{ name: '中文' }]);
    await engine.dispose();
    expect(await readFile(csvPath)).toEqual(bytes);
  });

  it.each([
    { encoding: 'utf-8', bytes: Buffer.from('name\n中文\n'), value: '中文' },
    { encoding: 'utf-16', bytes: Buffer.from('\ufeffname\n中文\n', 'utf16le'), value: '中文' },
    { encoding: 'latin-1', bytes: Buffer.from('name\nAndré\n', 'latin1'), value: 'André' },
  ])('reads the built-in $encoding encoding without loading extensions', async ({ encoding, bytes, value }) => {
    await writeFile(csvPath, bytes);
    await engine.load({ type: 'csv-file', options: { path: csvPath, options: { header: true, encoding } } });
    expect((await engine.execute('SELECT * FROM data')).data).toEqual([{ name: value }]);
  });

  it('rejects an unsupported encoding during file loading', async () => {
    await writeFile(csvPath, 'name\nAlice\n');
    await expect(
      engine.load({ type: 'csv-file', options: { path: csvPath, options: { encoding: 'not-a-real-encoding' } } })
    ).rejects.toThrow(/encoding/i);
  });

  it('accepts normalize_names, scalar nullstr and positional types', async () => {
    await writeFile(csvPath, 'Full Name,Home City\nAlice,NA\n');
    await engine.load({
      type: 'csv-file',
      options: {
        path: csvPath,
        options: {
          header: true,
          normalize_names: true,
          nullstr: 'NA',
          types: ['VARCHAR', 'VARCHAR'],
        },
      },
    });
    expect((await engine.execute('SELECT * FROM data')).data).toEqual([{ full_name: 'Alice', home_city: null }]);
  });
});

// These fragment assertions cover forwarding, not all DuckDB parameter semantics.
describe('loaders/csv-file reader option forwarding', () => {
  it.each(OPTIONS)('forwards valid %s through CSV file registration', async (name, value, expected) => {
    const run = vi.fn(async () => undefined);
    const source = await loadCSVFile({ path: '/test-owned/source.csv', options: { [name]: value } });
    await source.register({ run } as unknown as DuckDBConnection);
    expect(run).toHaveBeenCalledWith(expect.stringContaining("read_csv('/test-owned/source.csv'"));
    // Check forwarding, not the incidental DDL layout or duplicate auto_detect
    // defaults; a semantically equivalent registration may remove that duplicate.
    expect(run).toHaveBeenCalledWith(expect.stringContaining(`, ${name}=${expected}`));
  });
});
