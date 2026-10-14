import { describe, expect, it } from 'vitest';

import { serializeOptions, sqlUnionAll } from '../../src/util/sql';

describe('sqlUnionAll', () => {
  it.each([
    { queries: [], expected: '' },
    { queries: ['SELECT 1'], expected: 'SELECT 1' },
    { queries: ['SELECT 1', 'SELECT 1'], expected: 'SELECT 1\nUNION ALL\nSELECT 1' },
  ])('joins queries with UNION ALL: $queries', ({ queries, expected }) => {
    expect(sqlUnionAll(queries)).toBe(expected);
  });
});

describe('serializeOptions', () => {
  it.each([
    { key: 'columns', value: { id: 123 } },
    { key: 'sample_size', value: null },
    { key: 'sample_size', value: NaN },
    { key: 'sample_size', value: Infinity },
    { key: 'columns', value: ['VARCHAR', 123] },
    { key: 'columns', value: new Date(0) },
  ])('rejects unsupported values for $key', ({ key, value }) => {
    expect(() => serializeOptions({ [key]: value } as any)).toThrow(
      `Invalid DuckDB reader option "${key}": unsupported value`
    );
  });

  it('skips undefined while preserving false, zero and empty strings', () => {
    expect(serializeOptions()).toBe('');
    expect(serializeOptions({ sample_size: undefined })).toBe('');
    expect(serializeOptions({ header: false, skip: 0, nullstr: '' })).toBe(
      ', "header"=false, "skip"=0, "nullstr"=\'\''
    );
  });

  it('quotes reader parameter names and nested column names and types', () => {
    expect(serializeOptions({ columns: { "it's": 'VARCHAR' }, records: 'false', sample_size: -1 })).toBe(
      ', "columns"={\'it\'\'s\': \'VARCHAR\'}, "records"=\'false\', "sample_size"=-1'
    );
    expect(serializeOptions({ 'bad"key': true } as any)).toBe(', "bad""key"=true');
  });
});
