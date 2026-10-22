import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { sqlIdentifier, sqlStringLiteral } from '../../../src/util/sql';

import type { DataSourceConfig } from '../../../src/types';

describe('loader file access', () => {
  let directory: string;
  let engine: DuckDBEngine;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ava-access-'));
    await writeFile(join(directory, 'private.txt'), 'private sibling content');
    engine = new DuckDBEngine({ model: 'unused' });
  });

  afterEach(async () => {
    await engine.dispose();
    await rm(directory, { recursive: true, force: true });
  });

  it.each(['csv-file', 'json-file', 'parquet', 'excel', 'sqlite', 'csv', 'json'] as const)(
    'queries a %s source while blocking unrelated files',
    async (type) => {
      const file = join(directory, 'data.csv');
      await writeFile(file, 'id,name\n1,Alice\n');
      let config: DataSourceConfig;
      if (type === 'csv') config = { type, options: { csv: 'id,name\n1,Alice\n' } };
      else if (type === 'json') config = { type, options: { data: [{ id: 1, name: 'Alice' }] } };
      else if (type === 'json-file') {
        const path = join(directory, 'data.json');
        await writeFile(path, '[{"id":1,"name":"Alice"}]');
        config = { type, options: { path } };
      } else if (type === 'csv-file') {
        config = { type, options: { path: relative(process.cwd(), file) } };
      } else {
        const fixture = { parquet: '041_Airline.parquet', excel: 'sales.xlsx', sqlite: 'sales.sqlite' }[type];
        const path = join(directory, fixture);
        await copyFile(join(__dirname, '../../datasets', fixture), path);
        config = { type, options: { path } };
      }
      await engine.load(config);
      const schema = await engine.schema();
      const table = sqlIdentifier(schema.models[0].name);
      expect((await engine.execute(`SELECT COUNT(*) AS count FROM ${table}`)).data[0].count).toBeGreaterThan(0);
      await expect(
        engine.execute(`SELECT content FROM read_text(${sqlStringLiteral(join(directory, 'private.txt'))})`)
      ).rejects.toThrow(/Permission|disabled/);
      await expect(engine.execute(`SELECT * FROM glob(${sqlStringLiteral(join(directory, '*'))})`)).rejects.toThrow(
        /Permission|disabled/
      );
      expect((await engine.execute(`SELECT COUNT(*) AS count FROM ${table}`)).data[0].count).toBeGreaterThan(0);
    }
  );

  it('keeps matching CSV files queryable without authorizing other files or new matches', async () => {
    await writeFile(join(directory, 'first.csv'), 'id\n1\n');
    await writeFile(join(directory, 'second.csv'), 'id\n2\n');
    await engine.load({ type: 'csv-file', options: { path: join(directory, '*.csv'), options: { header: true } } });
    expect((await engine.execute('SELECT SUM(id) AS total FROM data')).data).toEqual([{ total: 3 }]);
    await expect(
      engine.execute(`SELECT * FROM read_text(${sqlStringLiteral(join(directory, 'private.txt'))})`)
    ).rejects.toThrow(/Permission|disabled/);
    await writeFile(join(directory, 'new.csv'), 'id\n3\n');
    await expect(engine.execute('SELECT * FROM data')).rejects.toThrow(/Permission|disabled/);
  });

  it('reads a Parquet directory without authorizing sibling files', async () => {
    await copyFile(join(__dirname, '../../datasets/041_Airline.parquet'), join(directory, 'data.parquet'));
    await engine.load({ type: 'parquet', options: { path: directory } });
    expect((await engine.execute('SELECT COUNT(*) AS count FROM data')).data[0].count).toBeGreaterThan(0);
    await expect(
      engine.execute(`SELECT * FROM read_text(${sqlStringLiteral(join(directory, 'private.txt'))})`)
    ).rejects.toThrow(/Permission|disabled/);
  });
});
