/**
 * Unit tests for src/duckdb/loaders/text.ts
 */

import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { skipLLMTests, getLLMConfig } from '../../test-utils';

describe.skipIf(skipLLMTests)('loaders/text', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('extracts structured data via LLM and registers a queryable view', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'text', options: { text: 'Beijing 100, Shanghai 200' } });

    const rows = await engine.execute('SELECT * FROM "data"');
    expect(rows.data.length).toBeGreaterThan(0);
  }, 30000);
});
