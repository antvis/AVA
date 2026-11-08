import { describe, expect, it } from 'vitest';

import { inferFileSourceType } from '../../src/index.browser';

describe('file source type inference', () => {
  it.each([
    ['sales.CSV', 'csv-file'],
    ['https://example.test/sales.json?key=1', 'json-file'],
    ['C:\\data\\sales.sqlite3', 'sqlite'],
    ['data.xlsx', 'excel'],
    ['data.unknown', undefined],
    ['data.constructor', undefined],
    ['data.__proto__', undefined],
  ])('infers %s as %s', (path, type) => expect(inferFileSourceType(path)).toBe(type));
});
