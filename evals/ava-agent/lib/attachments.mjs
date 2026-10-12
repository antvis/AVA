import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

export const MAX_ATTACHMENT_BYTES = 1024 * 1024 * 1024;

// Resolve only snapshotted evaluation tables; never expose questions or arbitrary host paths.
export async function readFixture(url, runDirectory) {
  if (!runDirectory || !/^ava-fixture:\d+\.(?:parquet|sqlite)$/.test(url)) {
    throw new Error('Unsupported evaluation attachment reference.');
  }
  const path = join(runDirectory, 'evals/fixtures', url.slice('ava-fixture:'.length));
  if ((await stat(path)).size > MAX_ATTACHMENT_BYTES) throw new Error('Evaluation attachment exceeds 1 GiB.');
  return readFile(path);
}
