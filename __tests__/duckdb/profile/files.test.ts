import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, it } from 'vitest';

import { fileSummary } from '../../../src/duckdb/profile-files';

it('weights repeated file sizes and checks resolved paths against the root', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ava-profile-files-'));
  try {
    const root = join(directory, 'files');
    await mkdir(root);
    await writeFile(join(root, 'a.txt'), 'example');
    const outside = join(directory, 'outside.txt');
    await writeFile(outside, 'outside');
    await symlink(outside, join(root, 'link.txt'));
    const result = await fileSummary([{ value: 'a.txt', count: 3 }], root);
    expect(result.histogram_file_size).toEqual({ bin_edges: [6.3, 7.7], counts: [3] });
    await expect(fileSummary([{ value: 'link.txt', count: 1 }], root)).rejects.toThrow('outside the configured root');
  } finally {
    await rm(directory, { recursive: true });
  }
});
