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

  it('dispatches object source to a registerable source', async () => {
    source = await loadSource(
      { type: 'object', options: { data: [{ a: 1 }] } },
      getLLMConfig()
    );

    expect(typeof source.register).toBe('function');
    expect(typeof source.cleanup).toBe('function');
  });

  it('throws for reserved database source types', async () => {
    await expect(
      loadSource({ type: 'postgresql', options: {} }, getLLMConfig())
    ).rejects.toThrow('not supported yet');
  });
});
