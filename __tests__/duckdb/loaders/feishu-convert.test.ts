import { describe, expect, it } from 'vitest';

import { asNumber, asTimestamp } from '../../../src/duckdb/loaders/feishu/convert';

describe('asNumber', () => {
  it('keeps numbers and parses numeric strings', () => {
    expect(asNumber(42)).toBe(42);
    expect(asNumber('42.5')).toBe(42.5);
  });

  it('returns null for empty or non-numeric values', () => {
    expect(asNumber(null)).toBeNull();
    expect(asNumber(undefined)).toBeNull();
    expect(asNumber('')).toBeNull();
    expect(asNumber('   ')).toBeNull();
    expect(asNumber('abc')).toBeNull();
  });
});

describe('asTimestamp', () => {
  it('converts millisecond timestamps to ISO strings', () => {
    expect(asTimestamp(1675526400000)).toBe('2023-02-04T16:00:00.000Z');
    expect(asTimestamp('1675526400000')).toBe('2023-02-04T16:00:00.000Z');
    expect(asTimestamp(0)).toBe('1970-01-01T00:00:00.000Z');
  });

  it('returns null for invalid or out-of-range timestamps', () => {
    expect(asTimestamp(null)).toBeNull();
    expect(asTimestamp('')).toBeNull();
    expect(asTimestamp('abc')).toBeNull();
    expect(asTimestamp(8640000000000001)).toBeNull();
  });
});
