/**
 * Unit tests for src/interpreter/loaders/text.ts
 */

import { describe, it, expect } from 'vitest';

import { loadText } from '../../../src/interpreter/loaders/text';
import { getLLMConfig, skipLLMTests } from '../../test-utils';

describe.skipIf(skipLLMTests)('interpreter/loaders/text', () => {
  it('extracts structured data from text via LLM', async () => {
    const rows = await loadText(
      { text: 'Alice is 30 years old. Bob is 25 years old.' },
      getLLMConfig(),
    );
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
  }, 30000);
});
