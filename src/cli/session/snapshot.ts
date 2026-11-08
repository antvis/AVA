import { copyFile, chmod, mkdir, realpath, stat } from 'fs/promises';
import { extname, join } from 'path';

import type { DataSourceConfig } from '../../types';

/** The worker owns a stable local source for the entire session, including SQLite's committed WAL. */
export async function snapshotSource(source: DataSourceConfig, directory: string): Promise<DataSourceConfig> {
  if (
    source.type !== 'csv-file' &&
    source.type !== 'json-file' &&
    source.type !== 'parquet' &&
    source.type !== 'excel' &&
    source.type !== 'sqlite'
  )
    return source;
  if (/^https?:\/\//i.test(source.options.path)) return source;

  const original = await realpath(source.options.path);
  if (!(await stat(original)).isFile()) throw new Error('A local source must be a regular file.');
  const storage = join(directory, 'source');
  await mkdir(storage, { mode: 0o700 });
  const path = join(storage, `data${extname(original)}`);
  if (source.type === 'sqlite') {
    // Copying the main file alone can lose transactions still in the WAL.
    const { DatabaseSync } = await import('node:sqlite');
    const database = new DatabaseSync(original, { readOnly: true });
    try {
      database.exec(`VACUUM INTO '${path.replace(/'/g, "''")}'`);
    } finally {
      database.close();
    }
  } else {
    await copyFile(original, path);
  }
  await chmod(path, 0o600);
  const snapshot = structuredClone(source);
  snapshot.options.path = path;
  return snapshot;
}
