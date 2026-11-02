import { describe, expect, it } from 'vitest';

import { columnTypes, convertRecord, supportedFields } from '../../../src/duckdb/loaders/tencent/convert';

const field = (fieldTitle: string, fieldType: number, fieldID = fieldTitle) => ({ fieldID, fieldTitle, fieldType });
const record = (values: Record<string, unknown>) => ({ recordID: 'r1', values });

describe('Tencent Docs OpenAPI conversion', () => {
  it('uses native numeric types, excludes complex types and distinguishes single-select 17 from 9', () => {
    const fields = supportedFields([field('n', 2), field('d', 4), field('s', 17), field('image', 5), field('old', 9)]);
    expect(columnTypes(fields)).toEqual({ _record_id: 'VARCHAR', n: 'DOUBLE', d: 'TIMESTAMPTZ', s: 'VARCHAR' });
    expect(() => supportedFields([field('x', 5)])).toThrow('no supported fields');
  });

  it('preserves zero, whitespace, empty text, null, missing and epoch zero', () => {
    const fields = supportedFields([
      field('n', 2),
      field('t', 1),
      field('e', 1),
      field('missing', 2),
      field('null', 2),
      field('d', 4),
    ]);
    expect(
      convertRecord(fields, record({ n: 0, t: [{ text: '  hello' }, { text: '\n' }], e: [], null: null, d: '0' }))
    ).toEqual({
      _record_id: 'r1',
      n: 0,
      t: '  hello\n',
      e: '',
      missing: null,
      null: null,
      d: '1970-01-01T00:00:00.000Z',
    });
  });

  it('converts rich text, finite raw numbers and single selections without display formatting', () => {
    const fields = [field('s', 17), field('n', 2)];
    expect(convertRecord(fields, record({ s: [{ id: 'o1', style: 1, text: 'East' }], n: 0.75 }))).toEqual({
      _record_id: 'r1',
      s: 'East',
      n: 0.75,
    });
    expect(convertRecord(fields, record({ s: [] })).s).toBeNull();
  });

  it.each([
    [2, '100'],
    [2, Infinity],
    [2, true],
    [4, 'invalid private value'],
    [4, '9999999999999999'],
    [17, [{ text: 'a' }, { text: 'b' }]],
    [1, [{ text: 42 }]],
    [1, 'raw'],
    [17, {}],
  ])('rejects malformed type %i without echoing cell contents', (type, value) => {
    expect(() => convertRecord([field('n', type)], record({ n: value }))).toThrow('Invalid value');
    try {
      convertRecord([field('n', type)], record({ n: value }));
    } catch (error) {
      expect(String(error)).not.toContain('private value');
    }
  });

  it.each([
    [field('Name', 1), field('name', 1)],
    [field('_RECORD_ID', 1)],
    [field('a', 1, 'id'), field('b', 1, 'id')],
    [{ fieldID: 'f', fieldTitle: '', fieldType: 1 }],
    [{ fieldID: 'f', fieldTitle: 't', fieldType: 'text' }],
  ])('rejects ambiguous or MCP metadata', (...metadata) => {
    expect(() => supportedFields(metadata)).toThrow();
  });

  it('rejects unexpected projected fields and malformed records', () => {
    expect(() => convertRecord([field('n', 2)], record({ renamed: 1 }))).toThrow();
    expect(() => convertRecord([field('n', 2)], { recordID: 'r', values: [] })).toThrow('Invalid record');
  });

  it('treats hostile names as data, not object prototypes', () => {
    const fields = supportedFields([field('__proto__', 1)]);
    const row = convertRecord(fields, record(Object.fromEntries([['__proto__', [{ text: 'safe' }]]])));
    expect(Object.getPrototypeOf(row)).toBe(Object.prototype);
    expect(Object.hasOwn(row, '__proto__')).toBe(true);
    expect(row['__proto__']).toBe('safe');
  });
});
