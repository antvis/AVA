import { mkdtemp, readFile, rm, stat, symlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { snapshotSource } from '../src/cli/session/snapshot';
import { AVA } from '../src';

import type { DataSourceConfig } from '../src/types';

let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'ava-snapshot-test-'));
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

function pathOf(source: DataSourceConfig): string {
  if (!('path' in source.options) || typeof source.options.path !== 'string') throw new Error('Expected a file source');
  return source.options.path;
}

async function workspace() {
  const path = join(directory, 'session');
  const { mkdir } = await import('fs/promises');
  await mkdir(path, { mode: 0o700 });
  return path;
}

describe('worker-owned local snapshots', () => {
  it('keeps lazy queries stable after the original is modified or removed', async () => {
    const original = join(directory, 'sales.csv');
    await writeFile(original, 'month,revenue\nJan,10\n');
    const source: DataSourceConfig = { type: 'csv-file', options: { path: original, options: { header: true } } };
    const snapshot = await snapshotSource(source, await workspace());
    const path = pathOf(snapshot);
    const ava = new AVA({ llm: { model: 'unused' } });
    try {
      expect(path).not.toBe(original);
      expect((await stat(path)).mode & 0o777).toBe(0o600);
      expect(snapshot.options).toMatchObject({ options: { header: true } });
      await ava.source(snapshot);
      await writeFile(original, 'month,revenue\nFeb,999\n');
      await rm(original);
      expect((await ava.query('SELECT * FROM data')).data).toEqual([{ month: 'Jan', revenue: 10 }]);
    } finally {
      await ava.dispose();
    }
    expect(source.options).toMatchObject({ path: original });
  });

  it.each(['json-file', 'parquet', 'excel'] as const)(
    'copies %s bytes and resolves symlinks without mutating the config',
    async (type) => {
      const original = join(directory, 'original.bin');
      const link = join(directory, 'link.bin');
      const content = Buffer.from([0, 1, 128, 255]);
      await writeFile(original, content);
      await symlink(original, link);
      const source = { type, options: { path: link } } as DataSourceConfig;
      const copy = await snapshotSource(source, await workspace());
      expect(await readFile(pathOf(copy))).toEqual(content);
      expect(pathOf(source)).toBe(link);
    }
  );

  it.skipIf(Number(process.versions.node.split('.')[0]) < 22)(
    'includes committed SQLite WAL transactions while a writer remains open',
    async () => {
      const { DatabaseSync } = await import('node:sqlite');
      const original = join(directory, 'live.sqlite');
      const writer = new DatabaseSync(original);
      try {
        writer.exec(
          'PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE sales(total INTEGER); INSERT INTO sales VALUES (10)'
        );
        expect((await stat(`${original}-wal`)).size).toBeGreaterThan(0);
        const copy = await snapshotSource({ type: 'sqlite', options: { path: original } }, await workspace());
        writer.exec('INSERT INTO sales VALUES (20)');
        const reader = new DatabaseSync(pathOf(copy), { readOnly: true });
        try {
          expect(
            reader
              .prepare('SELECT total FROM sales')
              .all()
              .map((row) => row.total)
          ).toEqual([10]);
        } finally {
          reader.close();
        }
        expect(writer.prepare('SELECT COUNT(*) AS count FROM sales').get()?.count).toBe(2);
      } finally {
        writer.close();
      }
    }
  );

  it('passes inline and remote sources through and rejects non-files', async () => {
    for (const source of [
      { type: 'json', options: { data: [] } },
      { type: 'csv-file', options: { path: 'https://example.test/sales.csv' } },
    ] as DataSourceConfig[])
      expect(await snapshotSource(source, directory)).toBe(source);
    await expect(snapshotSource({ type: 'csv-file', options: { path: directory } }, directory)).rejects.toThrow(
      'regular file'
    );
    await expect(
      snapshotSource({ type: 'sqlite', options: { path: join(directory, 'missing') } }, directory)
    ).rejects.toThrow();
  });
});
