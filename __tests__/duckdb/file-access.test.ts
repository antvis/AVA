import { readdirSync } from 'node:fs';
import { access, copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuckDBConnection } from '@duckdb/node-api';

import { DuckDBEngine } from '../../src/duckdb/engine';
import { sqlStringLiteral } from '../../src/util/sql';

import type { DataSourceConfig } from '../../src/types';

describe('DuckDB file access', () => {
  let engine: DuckDBEngine;
  let directory: string;

  beforeEach(async () => {
    engine = new DuckDBEngine({ model: 'unused' });
    directory = await mkdtemp(join(tmpdir(), "ava-access-'"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await engine.dispose();
    await rm(directory, { recursive: true, force: true });
  });

  it.each([
    ['csv-file', 'sales.csv', 'data'],
    ['json-file', 'customers.json', 'data'],
    ['parquet', '041_Airline.parquet', 'data'],
    ['excel', 'sales.xlsx', 'Sales'],
    ['sqlite', 'sales.sqlite', 'sales'],
  ] as const)('allows only the loaded %s file, including relative paths', async (type, fixture, table) => {
    const input = join(directory, fixture);
    const unrelated = join(directory, 'unrelated.txt');
    await copyFile(join(__dirname, '../datasets', fixture), input);
    await writeFile(unrelated, 'DUMMY_PRIVATE_CONTENT');
    await engine.load({ type, options: { path: relative(process.cwd(), input) } });

    expect((await engine.execute(`SELECT COUNT(*) AS count FROM "${table}"`)).data[0].count).toBeGreaterThan(0);
    await expect(engine.execute(`SELECT content FROM read_text(${sqlStringLiteral(unrelated)})`)).rejects.toThrow(
      /disabled by configuration/
    );
  });

  it.each<DataSourceConfig>([
    { type: 'json', options: { data: [{ value: 1 }] } },
    { type: 'csv', options: { csv: 'value\n1\n' } },
    { type: 'csv-file', options: { path: 'https://example.com/data.csv' } },
  ])('does not expose shared temporary files to $type sources', async (config) => {
    vi.spyOn(global, 'fetch').mockImplementation(async () => new Response('value\n1\n'));
    const unrelated = join(directory, 'unrelated.txt');
    await writeFile(unrelated, 'DUMMY_PRIVATE_CONTENT');
    await engine.load(config);

    expect((await engine.execute('SELECT * FROM data')).data).toEqual([{ value: 1 }]);
    await expect(engine.execute(`SELECT content FROM read_text(${sqlStringLiteral(unrelated)})`)).rejects.toThrow(
      /disabled by configuration/
    );
  });

  it('isolates concurrent sources and removes their private files on disposal', async () => {
    const other = new DuckDBEngine({ model: 'unused' });
    try {
      await engine.load({ type: 'json', options: { data: [{ value: 1 }] } });
      await other.load({ type: 'json', options: { data: [{ value: 2 }] } });
      const setting = await other.execute(
        "SELECT current_setting('allowed_paths') AS paths, current_setting('temp_directory') AS spill"
      );
      const [otherFile] = setting.data[0].paths as string[];
      const otherSpill = setting.data[0].spill as string;
      const spillFile = join(otherSpill, 'unrelated.txt');
      await writeFile(spillFile, 'OTHER_SOURCE_SPILL');

      for (const file of [otherFile, spillFile]) {
        await expect(engine.execute(`SELECT content FROM read_text(${sqlStringLiteral(file)})`)).rejects.toThrow(
          /disabled by configuration/
        );
      }
      expect((await other.execute('SELECT * FROM data')).data).toEqual([{ value: 2 }]);
      await other.dispose();
      await expect(access(dirname(otherFile))).rejects.toThrow();
      await expect(access(otherSpill)).rejects.toThrow();
      expect((await engine.execute('SELECT * FROM data')).data).toEqual([{ value: 1 }]);
    } finally {
      await other.dispose();
    }
  });

  it('replaces permissions and cleans private directories when reloading a source', async () => {
    await engine.load({ type: 'json', options: { data: [{ value: 1 }] } });
    const settings = await engine.execute(
      "SELECT current_setting('allowed_paths') AS paths, current_setting('temp_directory') AS spill"
    );
    const [file] = settings.data[0].paths as string[];
    const spill = settings.data[0].spill as string;
    await engine.load({ type: 'json', options: { data: [{ value: 2 }] } });
    await expect(access(dirname(file))).rejects.toThrow();
    await expect(access(spill)).rejects.toThrow();
    await expect(engine.execute(`SELECT * FROM read_text(${sqlStringLiteral(file)})`)).rejects.toThrow(
      /disabled by configuration/
    );
    expect((await engine.execute('SELECT * FROM data')).data).toEqual([{ value: 2 }]);
  });

  it('cleans generated data and spill storage if hardening fails', async () => {
    const run = DuckDBConnection.prototype.run;
    let file: string;
    let spill: string;
    vi.spyOn(DuckDBConnection.prototype, 'run').mockImplementation(async function (sql, values, types) {
      if (sql === 'SET lock_configuration = true') {
        const reader = await this.runAndReadAll(
          "SELECT current_setting('allowed_paths') AS paths, current_setting('temp_directory') AS spill"
        );
        const settings = reader.getRowObjectsJson()[0];
        [file] = settings.paths as string[];
        spill = settings.spill as string;
        throw new Error('Hardening failed');
      }
      return run.call(this, sql, values, types);
    });
    await expect(engine.load({ type: 'json', options: { data: [{ value: 1 }] } })).rejects.toThrow('Hardening failed');
    await expect(access(dirname(file!))).rejects.toThrow();
    await expect(access(spill!)).rejects.toThrow();
    await expect(engine.execute('SELECT 1')).rejects.toThrow('No data loaded');
  });

  it('can spill a memory-limited sort to private storage while keeping configuration locked', async () => {
    engine = new DuckDBEngine({ model: 'unused' }, { memoryLimit: '32MB', maxTempDirectorySize: '100MB' });
    await engine.load({ type: 'json', options: { data: [{ value: 1 }] } });
    const storage = await engine.execute("SELECT current_setting('temp_directory') AS spill");
    let spilled = false;
    const monitor = setInterval(() => {
      spilled ||= readdirSync(storage.data[0].spill as string).length > 0;
    }, 5);
    try {
      const result = await engine.execute(
        'SELECT SUM(i) AS total FROM (SELECT i FROM range(500000) t(i) ORDER BY repeat(md5(i::VARCHAR), 4))'
      );
      expect(result.data).toEqual([{ total: 124999750000 }]);
      expect(spilled).toBe(true);
    } finally {
      clearInterval(monitor);
    }
    const settings = await engine.execute(
      "SELECT current_setting('enable_external_access') AS external, current_setting('lock_configuration') AS locked"
    );
    expect(settings.data).toEqual([{ external: false, locked: true }]);
  });
});
