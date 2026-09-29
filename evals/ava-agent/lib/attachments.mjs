import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

// Resolve only snapshotted evaluation tables; never expose questions or arbitrary host paths.
export async function readFixture(url, runDirectory) {
  if (!runDirectory || !/^ava-fixture:\d+\.parquet$/.test(url)) {
    throw new Error('Unsupported evaluation attachment reference.');
  }
  const path = join(runDirectory, 'evals/fixtures/databench', url.slice('ava-fixture:'.length));
  if ((await stat(path)).size > 100 * 1024 * 1024) throw new Error('Evaluation attachment exceeds 100 MiB.');
  return readFile(path);
}
