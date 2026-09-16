/**
 * Unit tests for src/duckdb/loaders/csv.ts
 */

import * as fs from 'fs/promises';

import { describe, it, expect, afterEach } from 'vitest';

import { loadCSV } from '../../../src/duckdb/loaders/csv';

import type { LoadedSource } from '../../../src/types';

describe('loaders/csv', () => {
  let source: LoadedSource | null = null;

  afterEach(async () => {
    await source?.cleanup();
    source = null;
  });

  it('loads CSV content into a temp csv file', async () => {
    source = await loadCSV({ pathOrContent: 'name,age\nAlice,30\nBob,25' });

    expect(source.format).toBe('csv');
    const content = await fs.readFile(source.path, 'utf-8');
    expect(content).toContain('name,age');
    expect(content).toContain('Alice,30');
  });
});
