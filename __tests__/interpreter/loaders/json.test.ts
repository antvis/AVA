/**
 * Unit tests for src/interpreter/loaders/json.ts
 */

import { describe, it, expect } from 'vitest';

import { loadJson } from '../../../src/interpreter/loaders/json';

describe('interpreter/loaders/json', () => {
  it('returns a valid object array as-is', async () => {
    const data = [{ name: 'Alice', age: 30 }];
    expect(await loadJson({ data })).toEqual(data);
  });

  it('rejects non-array input', async () => {
    await expect(loadJson({ data: {} as any })).rejects.toThrow('Data must be an array');
  });

  it('rejects arrays containing non-object items', async () => {
    await expect(loadJson({ data: [1, 2, 3] as any })).rejects.toThrow(
      'All items in the array must be plain objects',
    );
  });
});
