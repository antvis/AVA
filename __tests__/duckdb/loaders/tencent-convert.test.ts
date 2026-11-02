import { describe, expect, it } from 'vitest';

import { columnTypes, convertRecord, supportedFields } from '../../../src/duckdb/loaders/tencent/convert';

const field = (field_title: string, field_type: string, field_id = field_title) => ({
  field_id,
  field_title,
  field_type,
});
const record = (field_values: unknown[]) => ({ record_id: 'r1', field_values });

describe('Tencent Docs field conversion', () => {
  it('uses the live MCP string enums, excludes complex types and preserves explicit SQL types', () => {
    const fields = supportedFields([field('n', 'number'), field('d', 'dateTime'), field('image', 'image')]);
    expect(fields).toHaveLength(2);
    expect(columnTypes(fields)).toEqual({ _record_id: 'VARCHAR', n: 'DOUBLE', d: 'TIMESTAMPTZ' });
    expect(() => supportedFields([field('x', 'formula')])).toThrow('no supported fields');
  });

  it('preserves zero, false, whitespace, empty text, null and epoch zero distinctly', () => {
    const fields = supportedFields([
      field('amount', 'number'),
      field('checked', 'checkbox'),
      field('text', 'text'),
      field('empty', 'text'),
      field('missing', 'number'),
      field('day', 'dateTime'),
    ]);
    expect(
      convertRecord(
        fields,
        record([
          { field: 'amount', number_value: 0 },
          { field: 'checked', bool_value: false },
          { field: 'text', text_value: { items: [{ text: '  hello' }, { text: '\n' }] } },
          { field: 'empty', text_value: { items: [] } },
          { field: 'day', string_value: '0' },
        ])
      )
    ).toEqual({
      _record_id: 'r1',
      amount: 0,
      checked: false,
      text: '  hello\n',
      empty: '',
      missing: null,
      day: '1970-01-01T00:00:00.000Z',
    });
  });

  it('converts single selections and keeps phone numbers as text', () => {
    const fields = supportedFields([field('region', 'singleSelect'), field('phone', 'phoneNumber')]);
    expect(
      convertRecord(
        fields,
        record([
          { field: 'region', option_value: { items: [{ id: 'o1', text: 'East' }] } },
          { field: 'phone', string_value: '00123' },
        ])
      )
    ).toEqual({ _record_id: 'r1', region: 'East', phone: '00123' });
    expect(convertRecord(fields, record([{ field: 'region', option_value: { items: [] } }])).region).toBeNull();
  });

  it.each(['number', 'currency', 'percentage', 'progress'])(
    'preserves the raw %s value without display formatting',
    (type) => {
      expect(convertRecord([field('n', type)], record([{ field: 'n', number_value: 0.75 }])).n).toBe(0.75);
    }
  );

  it.each([
    [field('n', 'number'), { field: 'n', number_value: '100' }],
    [field('n', 'number'), { field: 'n', number_value: Infinity }],
    [field('n', 'number'), { field: 'n', number_value: true }],
    [field('n', 'checkbox'), { field: 'n', bool_value: 'false' }],
    [field('n', 'dateTime'), { field: 'n', string_value: 'invalid private value' }],
    [field('n', 'dateTime'), { field: 'n', string_value: '9999999999999999' }],
    [field('n', 'singleSelect'), { field: 'n', option_value: { items: [{ text: 'a' }, { text: 'b' }] } }],
    [field('n', 'text'), { field: 'n', text_value: { items: [{ text: 42 }] } }],
  ])('rejects malformed supported cells without echoing their contents', (metadata, cell) => {
    expect(() => convertRecord([metadata], record([cell]))).toThrow('Invalid value');
    try {
      convertRecord([metadata], record([cell]));
    } catch (error) {
      expect(String(error)).not.toContain('private value');
    }
  });

  it.each([
    [field('Name', 'text'), field('name', 'text')],
    [field('_RECORD_ID', 'text')],
    [field('a', 'text', 'id'), field('b', 'text', 'id')],
    [{ field_id: 'f', field_title: '', field_type: 'text' }],
  ])('rejects ambiguous metadata', (...metadata) => {
    expect(() => supportedFields(metadata)).toThrow();
  });

  it('rejects duplicate cells, unknown projected fields and malformed records', () => {
    const fields = [field('n', 'number')];
    expect(() =>
      convertRecord(
        fields,
        record([
          { field: 'n', number_value: 1 },
          { field: 'n', number_value: 2 },
        ])
      )
    ).toThrow('duplicate');
    expect(() => convertRecord(fields, record([{ field: 'renamed', number_value: 1 }]))).toThrow();
    expect(() => convertRecord(fields, { field_values: [] })).toThrow('Invalid record');
  });

  it('treats hostile names as data, not object prototypes', () => {
    const fields = supportedFields([field('__proto__', 'text')]);
    const row = convertRecord(fields, record([{ field: '__proto__', text_value: { items: [{ text: 'safe' }] } }]));
    expect(Object.getPrototypeOf(row)).toBe(Object.prototype);
    expect(Object.hasOwn(row, '__proto__')).toBe(true);
    expect(row['__proto__']).toBe('safe');
  });
});
