/**
 * Unit tests for src/duckdb/loaders/index.ts
 */

import { describe, it, expect, afterEach } from 'vitest';

import { loadSource } from '../../../src/duckdb/loaders';
import { getLLMConfig } from '../../test-utils';

import type { LoadedSource } from '../../../src/types';

describe('loaders/index', () => {
  let source: LoadedSource | null = null;

  afterEach(async () => {
    await source?.cleanup();
    source = null;
  });

  it('dispatches object source to a temp json file', async () => {
    source = await loadSource(
      { type: 'object', options: { data: [{ a: 1 }] } },
      getLLMConfig()
    );

    expect(source.format).toBe('json');
  });

  it('throws for reserved database source types', async () => {
    await expect(
      loadSource({ type: 'mysql', options: {} }, getLLMConfig())
    ).rejects.toThrow('not supported yet');
  });
});
