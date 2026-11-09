import { describe, expect, it } from 'vitest';

import {
  NOTION_DATE_RANGE_SQL_TYPE,
  columnTypes,
  convertPage,
  supportedFields,
} from '../../../src/duckdb/loaders/notion/convert';

const field = (name: string, type: string, id = name) => ({
  id,
  name,
  type,
  ...(type === 'number'
    ? { number: { format: 'number' } }
    : type === 'select' || type === 'multi_select' || type === 'status'
    ? { [type]: { options: [] } }
    : type === 'formula'
    ? { formula: { expression: 'prop("Amount")' } }
    : { [type]: {} }),
});
const page = (properties: Record<string, unknown>) => ({ id: 'p1', properties });

describe('Notion field conversion', () => {
  it('maps supported properties to explicit DuckDB types and excludes complex ones', () => {
    const fields = supportedFields([
      field('Name', 'title'),
      field('Amount', 'number'),
      field('Done', 'checkbox'),
      field('Due', 'date'),
      field('Region', 'select'),
      field('Tags', 'multi_select'),
      field('Status', 'status'),
      field('Link', 'url'),
      field('Email', 'email'),
      field('Phone', 'phone_number'),
      field('Owner', 'people'),
      field('Parent', 'relation'),
    ]);
    expect(fields).toHaveLength(11);
    expect(columnTypes(fields)).toEqual({
      _id: 'VARCHAR',
      Name: 'VARCHAR',
      Amount: 'DOUBLE',
      Done: 'BOOLEAN',
      Due: 'TIMESTAMPTZ',
      Region: 'VARCHAR',
      Tags: 'VARCHAR[]',
      Status: 'VARCHAR',
      Link: 'VARCHAR',
      Email: 'VARCHAR',
      Phone: 'VARCHAR',
      Owner: 'VARCHAR[]',
    });
  });

  it('excludes unsupported property types entirely but keeps supported ones', () => {
    const fields = supportedFields([
      field('Name', 'title'),
      field('Files', 'files'),
      field('Rel', 'relation'),
      field('Btn', 'button'),
    ]);
    expect(fields.map((f) => f.type)).toEqual(['title']);
    expect(() => supportedFields([field('OnlyFiles', 'files')])).toThrow('no supported properties');
  });

  it('converts a page preserving zero, false, whitespace, empty and null distinctly', () => {
    const fields = supportedFields([
      field('Title', 'title'),
      field('Amount', 'number'),
      field('Done', 'checkbox'),
      field('Due', 'date'),
    ]);
    const row = convertPage(fields, {
      id: 'p1',
      properties: {
        Title: { type: 'title', title: [{ type: 'text', text: { content: '' }, plain_text: '  hello' }] },
        Amount: { type: 'number', number: 0 },
        Done: { type: 'checkbox', checkbox: false },
        Due: { type: 'date', date: { start: '2026-09-15', end: null, time_zone: null } },
      },
    });
    expect(row).toEqual({
      _id: 'p1',
      Title: '  hello',
      Amount: 0,
      Done: false,
      Due: '2026-09-15',
    });
  });

  it('concatenates rich text, preserves select lists and normalizes local dates to UTC', () => {
    const fields = supportedFields([
      field('Summary', 'rich_text'),
      field('Tags', 'multi_select'),
      field('Region', 'select'),
      field('Due', 'date'),
    ]);
    const row = convertPage(fields, {
      id: 'p1',
      properties: {
        Summary: {
          type: 'rich_text',
          rich_text: [
            { type: 'text', plain_text: 'a' },
            { type: 'text', plain_text: 'b' },
          ],
        },
        Tags: {
          type: 'multi_select',
          multi_select: [{ name: 'urgent' }, { name: 'bug' }],
        },
        Region: { type: 'select', select: null },
        Due: { type: 'date', date: { start: '2026-09-15T14:30:00', end: null, time_zone: null } },
      },
    });
    expect(row).toEqual({
      _id: 'p1',
      Summary: 'ab',
      Tags: ['urgent', 'bug'],
      Region: null,
      Due: '2026-09-15T14:30:00.000Z',
    });
  });

  it.each([
    { options: [{ name: 'a, b' }], expected: ['a, b'] },
    { options: [{ name: 'a' }, { name: 'b' }], expected: ['a', 'b'] },
    { options: [], expected: [] },
  ])('keeps multi-value boundaries and empty lists', ({ options, expected }) => {
    const fields = supportedFields([field('Tags', 'multi_select')]);
    const row = convertPage(fields, page({ Tags: { type: 'multi_select', multi_select: options } }));
    expect(row.Tags).toEqual(expected);
  });

  it('treats hostile names as data, not object prototypes', () => {
    const fields = supportedFields([field('__proto__', 'rich_text')]);
    const props: Record<string, unknown> = {};
    Object.defineProperty(props, '__proto__', {
      value: { type: 'rich_text', rich_text: [{ plain_text: 'safe' }] },
      enumerable: true,
      configurable: true,
    });
    const row = convertPage(fields, page(props));
    expect(Object.getPrototypeOf(row)).toBe(Object.prototype);
    expect(Object.hasOwn(row, '__proto__')).toBe(true);
    expect(row['__proto__']).toBe('safe');
  });

  it.each([
    {
      propertyType: 'formula',
      result: { type: 'number', number: 8 },
      sqlType: 'DOUBLE',
      value: 8,
    },
    {
      propertyType: 'formula',
      result: {
        type: 'date',
        date: { start: '2026-01-01T09:00:00', end: '2026-01-02T10:30:00', time_zone: 'Asia/Shanghai' },
      },
      sqlType: NOTION_DATE_RANGE_SQL_TYPE,
      value: { start: '2026-01-01T09:00:00', end: '2026-01-02T10:30:00', time_zone: 'Asia/Shanghai' },
    },
    {
      propertyType: 'formula',
      result: { type: 'string', string: null },
      sqlType: 'VARCHAR',
      value: null,
    },
    {
      propertyType: 'formula',
      result: { type: 'boolean', boolean: null },
      sqlType: 'BOOLEAN',
      value: null,
    },
    {
      propertyType: 'rollup',
      result: { type: 'number', number: null, function: 'sum' },
      sqlType: 'DOUBLE',
      value: null,
    },
  ])('derives computed SQL types and preserves typed values', ({ propertyType, result, sqlType, value }) => {
    const fields = supportedFields([field('Computed', propertyType)]);
    const row = convertPage(fields, page({ Computed: { type: propertyType, [propertyType]: result } }));
    expect(row).toEqual({ _id: 'p1', Computed: value });
    expect(columnTypes(fields)).toEqual({ _id: 'VARCHAR', Computed: sqlType });
  });

  it('uses user ids or a placeholder when Notion omits user names', () => {
    const fields = supportedFields([
      field('Creator', 'created_by'),
      field('Editor', 'last_edited_by'),
      field('Owners', 'people'),
    ]);
    const row = convertPage(
      fields,
      page({
        Creator: { type: 'created_by', created_by: { object: 'user', id: 'user-1' } },
        Editor: { type: 'last_edited_by', last_edited_by: { object: 'user', id: 'user-2', name: null } },
        Owners: {
          type: 'people',
          people: [{ object: 'user', id: 'user-3' }, { object: 'user' }],
        },
      })
    );
    expect(row).toEqual({ _id: 'p1', Creator: 'user-1', Editor: 'user-2', Owners: ['user-3', 'Unknown user'] });
  });

  it('converts a complete people property at the 25-user page-response boundary', () => {
    const f = field('Owners', 'people');
    const people = Array.from({ length: 25 }, (_, index) => ({ object: 'user', id: `user-${index}` }));
    const row = convertPage([f], page({ Owners: { type: 'people', people } }));
    expect(row.Owners).toHaveLength(25);
  });

  it.each([
    [{ id: 'f', name: 'Amount', type: 'number', number: { format: 'number' } }, 'amount', 'number'],
    [{ id: 'f', name: 'Amount', type: 'number', number: { format: 'number' } }, 'AMOUNT', 'checkbox'],
    [{ id: 'f', name: '_id', type: 'rich_text', rich_text: {} }],
    [
      { id: 'f', name: 'Amount', type: 'number', number: { format: 'number' } },
      { id: 'f', name: 'Other', type: 'rich_text', rich_text: {} },
    ],
  ])('rejects ambiguous or duplicate metadata', (...items) => {
    expect(() => supportedFields(items)).toThrow();
  });

  it.each([
    [field('Amount', 'number'), { type: 'number', number: 'bad' }],
    [field('Done', 'checkbox'), { type: 'checkbox', checkbox: 'yes' }],
    [field('Due', 'date'), { type: 'date', date: { start: 42, end: null, time_zone: null } }],
    [field('Region', 'select'), { type: 'select', select: { name: 42 } }],
    [field('Summary', 'rich_text'), { type: 'rich_text', rich_text: [{ plain_text: 42 }] }],
  ])('rejects malformed supported cells without echoing their contents', (f, property) => {
    expect(() => convertPage([f], page({ [f.name]: property }))).toThrow('Invalid value');
    try {
      convertPage([f], page({ [f.name]: property }));
    } catch (error) {
      expect(String(error)).not.toContain('bad');
    }
  });

  it('rejects malformed pages without a properties map', () => {
    const f = field('Amount', 'number');
    expect(() => convertPage([f], { id: 'p1' })).toThrow('Invalid page');
  });
});
