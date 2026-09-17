/**
 * Unit tests for src/duckdb/loaders/text.ts
 */

import { describe, it, expect, afterEach } from 'vitest';

import { loadText } from '../../../src/duckdb/loaders/text';
import { skipLLMTests, getLLMConfig } from '../../test-utils';

import { registerAndQuery } from './helper';

import type { LoadedSource } from '../../../src/types';

describe.skipIf(skipLLMTests)('loaders/text', () => {
  let source: LoadedSource | null = null;

  afterEach(async () => {
    await source?.cleanup();
    source = null;
  });

  it('extracts structured data via LLM and registers a queryable view', async () => {
    source = await loadText({ text: 'Beijing 100, Shanghai 200' }, getLLMConfig());

    const rows = await registerAndQuery(source);
    expect(rows.length).toBeGreaterThan(0);
  });
});
