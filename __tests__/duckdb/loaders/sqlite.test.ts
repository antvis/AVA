import { mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import { DuckDBInstance } from '@duckdb/node-api';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AVA } from '../../../src';
import { loadSource } from '../../../src/duckdb/loaders';
import { sqlStringLiteral } from '../../../src/util/sql';
import { getLLMConfig } from '../../test-utils';

describe('loaders/sqlite', () => {
  let directory: string;
  let filePath: string;
  let ava: AVA;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ava-sqlite-'));
    filePath = join(directory, "sales' data.sqlite");
    ava = new AVA({ llm: getLLMConfig() });
    const instance = await DuckDBInstance.create(':memory:');
    const conn = await instance.connect();
    try {
      await conn.run('INSTALL sqlite');
      await conn.run('LOAD sqlite');
      await conn.run(`ATTACH ${sqlStringLiteral(filePath)} AS fixture (TYPE sqlite)`);
      await conn.run('CREATE TABLE fixture.customers (id INTEGER, name TEXT)');
      await conn.run('INSERT INTO fixture.customers VALUES (1, \'Alice\'), (2, NULL)');
      await conn.run('CREATE TABLE fixture."order notes" (customer_id INTEGER, "note""text" TEXT, amount REAL)');
      await conn.run('INSERT INTO fixture."order notes" VALUES (1, \'paid\', 12.5)');
      await conn.run('CREATE TABLE fixture.empty_table (id INTEGER)');
    } finally {
      conn.closeSync();
      instance.closeSync();
    }
  });

  afterEach(async () => {
    await ava?.dispose();
    await rm(directory, { recursive: true, force: true });
  });

  it('loads all tables through AVA and queries joins after access lockdown', async () => {
    const original = await readFile(filePath);
    const schema = await ava.load({ type: 'sqlite', options: { path: relative(process.cwd(), filePath) } });
    expect(schema).toEqual({
      tables: [
        {
          name: 'customers',
          columnCount: 2,
          fields: [
            { name: 'id', type: 'BIGINT', nullable: true },
            { name: 'name', type: 'VARCHAR', nullable: true },
          ],
          indexes: [],
        },
        {
          name: 'empty_table',
          columnCount: 1,
          fields: [{ name: 'id', type: 'BIGINT', nullable: true }],
          indexes: [],
        },
        {
          name: 'order notes',
          columnCount: 3,
          fields: [
            { name: 'customer_id', type: 'BIGINT', nullable: true },
            { name: 'note"text', type: 'VARCHAR', nullable: true },
            { name: 'amount', type: 'DOUBLE', nullable: true },
          ],
          indexes: [],
        },
      ],
      relations: [],
    });
    const result = await ava.engine!.execute(
      'SELECT c.name, n."note""text", n.amount FROM customers c JOIN "order notes" n ON c.id = n.customer_id'
    );
    expect(result.data).toEqual([{ name: 'Alice', 'note"text': 'paid', amount: 12.5 }]);
    expect((await ava.engine!.execute('SELECT name FROM customers WHERE id = 2')).data).toEqual([{ name: null }]);
    expect((await ava.engine!.execute('SELECT * FROM empty_table')).data).toEqual([]);
    await ava.dispose();
    expect(await readFile(filePath)).toEqual(original);
    await ava.load({ type: 'sqlite', options: { path: filePath } });
    await ava.load({ type: 'json', options: { data: [{ replacement: 1 }] } });
    expect((await ava.engine!.execute('SELECT * FROM data')).data).toEqual([{ replacement: 1 }]);
  });

  it('attaches read-only even without engine query validation', async () => {
    const source = await loadSource({ type: 'sqlite', options: { path: filePath } }, getLLMConfig());
    const instance = await DuckDBInstance.create(':memory:');
    const conn = await instance.connect();
    try {
      expect(await source.register(conn)).toEqual(['customers', 'empty_table', 'order notes']);
      await expect(conn.run('INSERT INTO sqlite_source.customers VALUES (3, NULL)')).rejects.toThrow(/read.only/i);
    } finally {
      conn.closeSync();
      instance.closeSync();
      await source.cleanup();
    }
  });

  it('rejects a missing file without creating it and can recover on the next load', async () => {
    const missing = join(directory, 'missing.sqlite');
    await expect(ava.load({ type: 'sqlite', options: { path: missing } })).rejects.toThrow();
    await expect(access(missing)).rejects.toThrow();
    expect(ava.engine).toBeNull();
    await expect(ava.load({ type: 'sqlite', options: { path: filePath } })).resolves.toHaveProperty('tables');
  });

  it('rejects invalid database files', async () => {
    await writeFile(filePath, 'not a SQLite database');
    await expect(ava.load({ type: 'sqlite', options: { path: filePath } })).rejects.toThrow();
    expect(ava.engine).toBeNull();
  });
});
