/**
 * Unit tests for src/duckdb/loaders/object.ts
 */

import * as fs from 'fs/promises';

import { describe, it, expect, afterEach } from 'vitest';

import { loadObject } from '../../../src/duckdb/loaders/object';

import type { LoadedSource } from '../../../src/types';

describe('loaders/object', () => {
  let source: LoadedSource | null = null;

  afterEach(async () => {
    await source?.cleanup();
    source = null;
  });

  it('writes an object array to a temp json file', async () => {
    source = await loadObject({ data: [{ name: 'Alice', age: 30 }] });

    expect(source.format).toBe('json');
    const content = JSON.parse(await fs.readFile(source.path, 'utf-8'));
    expect(content).toEqual([{ name: 'Alice', age: 30 }]);
  });

  it('rejects non-array input', async () => {
    await expect(loadObject({ data: {} as any })).rejects.toThrow('Data must be an array');
  });
});
