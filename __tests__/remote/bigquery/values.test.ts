import { describe, expect, it } from 'vitest';

import { fieldType, logicalType, rowObject } from '../../../src/remote/bigquery/values';

import type { Field } from '../../../src/remote/bigquery/api';

describe('BigQuery field types', () => {
  it.each<[Field, string]>([
    [{ name: 'a', type: 'INTEGER' }, 'INT64'],
    [{ name: 'a', type: 'FLOAT' }, 'FLOAT64'],
    [{ name: 'a', type: 'BOOLEAN' }, 'BOOL'],
    [{ name: 'a', type: 'NUMERIC', precision: '10', scale: '2' }, 'NUMERIC(10, 2)'],
    [{ name: 'a', type: 'BIGNUMERIC', precision: '40' }, 'BIGNUMERIC(40)'],
    [{ name: 'a', type: 'STRING', maxLength: '20' }, 'STRING(20)'],
    [{ name: 'a', type: 'RANGE', rangeElementType: { type: 'DATE' } }, 'RANGE<DATE>'],
    [{ name: 'a', type: 'STRING', mode: 'REPEATED' }, 'ARRAY<STRING>'],
    [
      {
        name: 'a',
        type: 'RECORD',
        fields: [
          { name: 'x', type: 'INTEGER' },
          { name: 'two words', type: 'RECORD', mode: 'REPEATED', fields: [{ name: 'z', type: 'STRING' }] },
        ],
      },
      'STRUCT<x INT64, `two words` ARRAY<STRUCT<z STRING>>>',
    ],
  ])('renders %j as %s', (field, type) => {
    expect(fieldType(field)).toBe(type);
  });

  it.each([
    ['INT64', 'numeric'],
    ['NUMERIC(10, 2)', 'numeric'],
    ['BIGNUMERIC', 'numeric'],
    ['FLOAT64', 'numeric'],
    ['STRING(20)', 'string'],
    ['BOOL', 'boolean'],
    ['DATE', 'date'],
    ['DATETIME', 'date'],
    ['TIMESTAMP', 'date'],
    ['TIME', 'unknown'],
    ['BYTES', 'unknown'],
    ['JSON', 'unknown'],
    ['GEOGRAPHY', 'unknown'],
    ['ARRAY<INT64>', 'unknown'],
    ['STRUCT<a NUMERIC(10, 2)>', 'unknown'],
  ])('maps %s to the %s profile type', (type, expected) => {
    expect(logicalType(type)).toBe(expected);
  });
});

describe('BigQuery row values', () => {
  const field = (type: string, extra: Partial<Field> = {}): Field[] => [{ name: 'value', type, ...extra }];
  const value = (fields: Field[], v: unknown) => rowObject(fields, { f: [{ v }] }).value;

  it.each([
    ['INTEGER', '42', 42],
    ['INTEGER', '-9007199254740991', -9007199254740991],
    ['INTEGER', '9007199254740993', '9007199254740993'],
    ['FLOAT', '1.5', 1.5],
    ['FLOAT', 'NaN', 'NaN'],
    ['FLOAT', '-Infinity', '-Infinity'],
    ['NUMERIC', '19.9', 19.9],
    ['NUMERIC', '-0.000000001', -0.000000001],
    ['NUMERIC', '100', 100],
    ['NUMERIC', '12345678901234567890.123456789', '12345678901234567890.123456789'],
    ['BIGNUMERIC', '0.1', 0.1],
    ['BOOLEAN', 'true', true],
    ['BOOLEAN', 'false', false],
    ['STRING', 'hé', 'hé'],
    ['BYTES', 'AP8=', 'AP8='],
    ['DATE', '0001-01-01', '0001-01-01'],
    ['DATETIME', '2024-03-01T09:00:00', '2024-03-01T09:00:00'],
    ['TIME', '12:34:56.000001', '12:34:56.000001'],
    ['TIMESTAMP', '1709283600000000', '2024-03-01T09:00:00Z'],
    ['TIMESTAMP', '1709560800123456', '2024-03-04T14:00:00.123456Z'],
    ['TIMESTAMP', '-1', '1969-12-31T23:59:59.999999Z'],
    ['TIMESTAMP', '1.7092836E9', '2024-03-01T09:00:00Z'],
    ['GEOGRAPHY', 'POINT(120.15 30.28)', 'POINT(120.15 30.28)'],
    ['JSON', '{"a":[1,{"b":null}]}', { a: [1, { b: null }] }],
    ['INTERVAL', '1-2 3 4:5:6', '1-2 3 4:5:6'],
    ['RANGE', '[2024-01-01, UNBOUNDED)', '[2024-01-01, UNBOUNDED)'],
    ['STRING', null, null],
  ])('converts %s %j', (type, raw, expected) => {
    expect(value(field(type), raw)).toEqual(expected);
  });

  it('converts arrays and nested structs by field name', () => {
    const fields: Field[] = [
      { name: 'numbers', type: 'INTEGER', mode: 'REPEATED' },
      {
        name: 'nested',
        type: 'RECORD',
        fields: [
          { name: 'x', type: 'INTEGER' },
          { name: 'y', type: 'RECORD', mode: 'REPEATED', fields: [{ name: 'z', type: 'STRING' }] },
        ],
      },
      { name: 'empty', type: 'STRING', mode: 'REPEATED' },
      { name: 'missing', type: 'RECORD', fields: [{ name: 'x', type: 'INTEGER' }] },
    ];
    expect(
      rowObject(fields, {
        f: [
          { v: [{ v: '1' }, { v: '2' }] },
          { v: { f: [{ v: '7' }, { v: [{ v: { f: [{ v: 'z1' }] } }, { v: { f: [{ v: 'z2' }] } }] }] } },
          { v: [] },
          { v: null },
        ],
      })
    ).toEqual({ numbers: [1, 2], nested: { x: 7, y: [{ z: 'z1' }, { z: 'z2' }] }, empty: [], missing: null });
  });

  it('keeps malformed JSON text instead of failing the whole result', () => {
    expect(value(field('JSON'), '{oops')).toBe('{oops');
  });
});
