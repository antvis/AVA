/**
 * Unit tests for src/duckdb/loaders/text.ts
 */

import * as fs from 'fs/promises';

import { describe, it, expect, afterEach } from 'vitest';

import { loadText } from '../../../src/duckdb/loaders/text';
import { skipLLMTests, getLLMConfig } from '../../test-utils';

import type { LoadedSource } from '../../../src/types';

describe.skipIf(skipLLMTests)('loaders/text', () => {
  let source: LoadedSource | null = null;

  afterEach(async () => {
    await source?.cleanup();
    source = null;
  });

  it('extracts structured data via LLM into a temp json file', async () => {
    source = await loadText({ text: 'Beijing 100, Shanghai 200' }, getLLMConfig());

    expect(source.format).toBe('json');
    const content = JSON.parse(await fs.readFile(source.path, 'utf-8'));
    expect(Array.isArray(content)).toBe(true);
    expect(content.length).toBeGreaterThan(0);
  });
});
