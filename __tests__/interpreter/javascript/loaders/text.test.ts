/**
 * Unit tests for src/interpreter/javascript/loaders/text.ts
 */

import { describe, it, expect } from 'vitest';

import { loadText } from '../../../../src/interpreter/javascript/loaders/text';
import { getLLMConfig, skipLLMTests } from '../../../test-utils';

describe.skipIf(skipLLMTests)('interpreter/javascript/loaders/text', () => {
  it('extracts structured data from text via LLM', async () => {
    const rows = await loadText({ text: 'Alice is 30 years old. Bob is 25 years old.' }, getLLMConfig());
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(2);
    expect(rows.map(Object.values)).toEqual(
      expect.arrayContaining([expect.arrayContaining(['Alice', 30]), expect.arrayContaining(['Bob', 25])])
    );
  }, 30000);
});
