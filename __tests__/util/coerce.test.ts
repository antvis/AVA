import { describe, expect, it } from 'vitest';

import { coerceNumbers } from '../../src/util/coerce';

describe('coerceNumbers', () => {
  it('uses column types instead of guessing from values, without mutating input', () => {
    const rows = [{ text: '42', integer: '42', unknown: '42', empty: '', missing: null, number: 2.5 }];
    const result = coerceNumbers(rows, [
      { name: 'text', type: 'VARCHAR' },
      { name: 'integer', type: 'BIGINT' },
      { name: 'unknown' },
      { name: 'empty', type: 'VARCHAR' },
      { name: 'missing', type: 'INTEGER' },
      { name: 'number', type: 'DOUBLE' },
    ]);

    expect(result).toEqual([{ ...rows[0], integer: 42 }]);
    expect(rows[0].integer).toBe('42');
    expect(result[0]).not.toBe(rows[0]);
  });

  it.each([
    ['BIGINT', '9007199254740991', 9007199254740991],
    ['BIGINT', '9007199254740993', '9007199254740993'],
    ['BIGINT', '-9007199254740993', '-9007199254740993'],
    ['UHUGEINT', '18446744073709551615', '18446744073709551615'],
    ['DECIMAL(20,3)', '12.500', 12.5],
    ['DECIMAL(20,3)', '-0.000', '-0.000'],
    ['DECIMAL(20,3)', '0.000', 0],
    ['DECIMAL(38,20)', '0.12345678901234567890', '0.12345678901234567890'],
    ['DECIMAL(38,20)', '1.00000000000000000001', '1.00000000000000000001'],
    ['DOUBLE', '1e3', '1e3'],
    ['DOUBLE', 'Infinity', 'Infinity'],
    ['DOUBLE', 'NaN', 'NaN'],
    ['DOUBLE', '', ''],
  ])('converts %s value %s conservatively', (type, value, expected) => {
    expect(coerceNumbers([{ value }], [{ name: 'value', type }])).toEqual([{ value: expected }]);
  });
});
