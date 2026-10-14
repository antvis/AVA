import { describe, expect, it } from 'vitest';

import { sourceSchema } from '../../../src/interpreter/python/util/schema';
import { excelRange } from '../../../src/util/excel';

import type { DataSourceConfig } from '../../../src/types';

const source: DataSourceConfig = {
  type: 'excel',
  options: { path: '/fixtures/data.xlsx', sheets: [{ name: 'First', range: 'A2:A3', header: false }] },
};

describe('Python Excel selections', () => {
  it('preserves selection and normalizes the shared defaults', () => {
    expect(sourceSchema.parse(source)).toEqual(source);
    expect(
      sourceSchema.parse({ type: 'excel', options: { path: 'data.xlsx', sheets: [{ name: 'First', range: 'b3:c6' }] } })
    ).toEqual({
      type: 'excel',
      options: { path: 'data.xlsx', sheets: [{ name: 'First', range: 'B3:C6', header: true }] },
    });
  });

  it.each(['A0:B1', 'B2:A3', 'A3:B2', 'A1:XFE3', 'A1:A1048577', 'Sales!A1:B3'])('rejects invalid range %s', (range) => {
    expect(() => excelRange(range)).toThrow();
    expect(() =>
      sourceSchema.parse({ ...source, options: { ...source.options, sheets: [{ name: 'First', range }] } })
    ).toThrow();
  });

  it.each([
    { sheets: ['First'] },
    { range: 'A1:B3' },
    { header: false },
    { sheets: [{ name: 'First' }, { name: 'First', header: false }] },
  ])('rejects ambiguous or obsolete configuration %j', (options) => {
    expect(() => sourceSchema.parse({ type: 'excel', options: { path: 'data.xlsx', ...options } })).toThrow();
  });

  it('rejects empty sheets and unsupported options', () => {
    expect(() => sourceSchema.parse({ ...source, options: { ...source.options, sheets: [] } })).toThrow();
    expect(() => sourceSchema.parse({ ...source, options: { ...source.options, skip: 2 } })).toThrow();
  });
});
