import { describe, expect, it } from 'vitest';

import { serializeOptions, sqlUnionAll } from '../../src/util/sql';
import { CSV_READ_OPTION_CASES as OPTIONS } from '../fixtures/csv-read-options';

import type { CSVReadOptions } from '../../src/types';

describe('sqlUnionAll', () => {
  it('joins queries with UNION ALL', () => {
    expect(sqlUnionAll(['SELECT 1', 'SELECT 1'])).toBe('SELECT 1\nUNION ALL\nSELECT 1');
  });
});

// serializeOptions serializes the typed reader options; it is not a per-key
// runtime validator. Unsupported value shapes are skipped, not coerced.
describe('serializeOptions', () => {
  it.each(OPTIONS)('serializes %s using its declared value type', (name, value, sql) => {
    expect(serializeOptions({ [name]: value })).toBe(`, ${name}=${sql}`);
  });

  it.each([
    ['mixed list', ['NULL', 1]],
    ['non-string map', { code: 1 }],
    ['function', () => 'x'],
    ['symbol', Symbol('x')],
  ])('skips an unserializable runtime value: %s', (_name, value) => {
    // Deliberately bypass the type boundary only to exercise documented
    // unsupported-value handling, not a nonexistent key/type whitelist.
    expect(serializeOptions({ nullstr: value } as unknown as CSVReadOptions)).toBe('');
  });

  it('does not inject defaults into omitted reader options', () => {
    expect(serializeOptions()).toBe('');
    expect(serializeOptions({})).toBe('');
  });

  it('retains empty lists/maps and drops empty strings', () => {
    expect(serializeOptions({ nullstr: [], columns: {}, delim: '', encoding: '' })).toBe(', nullstr=[], columns={}');
  });

  it('escapes values and map keys without executing SQL-shaped input', () => {
    expect(serializeOptions({ nullstr: ["O'Reilly"], columns: { "a'b": 'VARCHAR' } })).toBe(
      ", nullstr=['O''Reilly'], columns={'a''b': 'VARCHAR'}"
    );
  });

  it.each([NaN, Infinity, -Infinity])('does not serialize non-finite integers: %s', (value) => {
    expect(serializeOptions({ skip: value })).toBe('');
  });
});
