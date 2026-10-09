/**
 * Unit tests for src/interpreter/javascript/loaders/csv.ts
 */

import { describe, it, expect } from 'vitest';

import { loadCSV } from '../../../../src/interpreter/javascript/loaders/csv';

describe('interpreter/javascript/loaders/csv', () => {
  it('parses CSV content into rows with type casting', async () => {
    const rows = await loadCSV({ csv: 'name,age\nAlice,30\nBob,25' });
    expect(rows).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);
  });
});
