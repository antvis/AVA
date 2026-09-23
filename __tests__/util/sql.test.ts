import { describe, expect, it } from 'vitest';

import { sqlUnionAll } from '../../src/util/sql';

describe('sqlUnionAll', () => {
  it.each([
    { queries: [], expected: '' },
    { queries: ['SELECT 1'], expected: 'SELECT 1' },
    { queries: ['SELECT 1', 'SELECT 1'], expected: 'SELECT 1\nUNION ALL\nSELECT 1' },
  ])('joins queries with UNION ALL: $queries', ({ queries, expected }) => {
    expect(sqlUnionAll(queries)).toBe(expected);
  });
});
