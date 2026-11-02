import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { columnTypes, convertRecord, supportedFields } from '../../../src/duckdb/loaders/tencent/convert';

const field = (fieldType: number) => ({ fieldID: 'f', fieldTitle: 'value', fieldType });
afterEach(() => vi.unstubAllGlobals());

describe('Tencent Docs native currency 26 / percentage 28', () => {
  it.each([26, 28])('maps independently verified native type %i to DOUBLE', (type) => {
    expect(columnTypes(supportedFields([field(type)]))).toEqual({ _record_id: 'VARCHAR', value: 'DOUBLE' });
  });
  it.each([26, 28].flatMap((type) => [0, 1234.56, -12.34, 0.125, -0.25].map((value) => ({ type, value }))))(
    'preserves type $type raw numeric value $value without formatting or scaling',
    ({ type, value }) => {
      expect(convertRecord([field(type)], { recordID: 'r', values: { value } })).toEqual({ _record_id: 'r', value });
    }
  );
  it.each([26, 28])('preserves null and omitted cells for type %i', (type) => {
    for (const values of [{}, { value: null }]) {
      expect(convertRecord([field(type)], { recordID: 'r', values })).toEqual({ _record_id: 'r', value: null });
    }
  });
  it.each(
    [26, 28].flatMap((type) => ['12.5%', '¥1,234.56', true, Infinity, NaN, {}, []].map((value) => ({ type, value })))
  )('rejects formatted or invalid native numeric type $type: $value', ({ type, value }) => {
    expect(() => convertRecord([field(type)], { recordID: 'r', values: { value } })).toThrow('Invalid value');
  });
  it('does not infer unknown numeric types from currency-like titles', () => {
    expect(() => supportedFields([{ fieldID: 'f', fieldTitle: 'currency', fieldType: 27 }])).toThrow('no supported');
  });
  it.each([false, true])('materializes explicit native types including empty tables: empty=%s', async (empty) => {
    const definitions = [
      { fieldID: 'c', fieldTitle: 'amount', fieldType: 26 },
      { fieldID: 'p', fieldTitle: 'ratio', fieldType: 28 },
    ];
    const rows = empty
      ? []
      : [
          { recordID: 'r1', values: { amount: 1234.56, ratio: 0.125 } },
          { recordID: 'r2', values: { amount: -12.34, ratio: -0.25 } },
          { recordID: 'r3', values: { amount: 0, ratio: 0 } },
          { recordID: 'r4', values: {} },
        ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        const body = JSON.parse(init.body);
        const operation = body.getFields ? 'getFields' : 'getRecords';
        const { offset, limit } = body[operation];
        const all = operation === 'getFields' ? definitions : rows;
        const batch = all.slice(offset, offset + limit);
        return Response.json({
          ret: 0,
          data: {
            [operation]: {
              [operation === 'getFields' ? 'fields' : 'records']: batch,
              total: all.length,
              hasMore: offset + batch.length < all.length,
              next: offset + batch.length,
            },
          },
        });
      })
    );
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await ava.source({
        type: 'tencent-smartsheet',
        options: {
          fileId: 'file',
          sheetId: 'sheet',
          clientId: 'client',
          openId: 'open',
          accessToken: 'token',
          pageSize: 1,
        },
      });
      const columns = (await ava.schema()).models.find((model) => model.name === 'data')!.columns;
      expect(columns.map(({ name, type }) => [name, type])).toEqual([
        ['_record_id', 'VARCHAR'],
        ['amount', 'DOUBLE'],
        ['ratio', 'DOUBLE'],
      ]);
      expect((await ava.query('SELECT amount, ratio FROM data ORDER BY _record_id')).data).toEqual(
        empty
          ? []
          : [
              { amount: 1234.56, ratio: 0.125 },
              { amount: -12.34, ratio: -0.25 },
              { amount: 0, ratio: 0 },
              { amount: null, ratio: null },
            ]
      );
    } finally {
      await ava.dispose();
    }
  });
});
