/**
 * File helpers: temp file creation, remote download, and cleanup.
 */

import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

/** Write content to a unique temp file and return its path */
export async function writeTempFile(content: string | Buffer, ext: string): Promise<string> {
  const tmpFile = path.join(
    os.tmpdir(),
    `ava-source-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  );
  await fs.writeFile(tmpFile, content);
  return tmpFile;
}

/** Download a remote URL to a temp file and return its path */
export async function downloadToTempFile(
  url: string,
  ext: string,
  headers?: Record<string, string>
): Promise<string> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return writeTempFile(Buffer.from(await response.arrayBuffer()), ext);
}

/** Delete a temp file, ignoring errors */
export async function removeTempFile(filePath: string): Promise<void> {
  await fs.unlink(filePath).catch(() => {});
}
