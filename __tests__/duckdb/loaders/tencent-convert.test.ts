import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
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

describe('restored scalar contracts and loader', () => {
  const field = (fieldTitle: string, fieldType: number) => ({ fieldID: `f-${fieldTitle}`, fieldTitle, fieldType });
  const definitions = [
    field('checked', 3),
    field('created', 12),
    field('modified', 13),
    field('progress', 14),
    field('phone', 15),
    field('email', 16),
  ];
  const fields = supportedFields(definitions);
  const record = (values: Record<string, unknown>) => ({ recordID: 'r1', values });
  afterEach(() => vi.unstubAllGlobals());

  describe('Tencent Docs restored OpenAPI scalar contracts', () => {
    it('restores the six documented field types with explicit SQL types', () => {
      expect(columnTypes(fields)).toEqual({
        _record_id: 'VARCHAR',
        checked: 'BOOLEAN',
        created: 'TIMESTAMPTZ',
        modified: 'TIMESTAMPTZ',
        progress: 'DOUBLE',
        phone: 'VARCHAR',
        email: 'VARCHAR',
      });
    });

    it('retains false, zero, raw progress, empty/leading-zero strings and system timestamp cells', () => {
      expect(
        convertRecord(
          fields,
          record({ checked: false, created: '0', modified: '1767225600123', progress: 0, phone: '00123', email: '' })
        )
      ).toEqual({
        _record_id: 'r1',
        checked: false,
        created: '1970-01-01T00:00:00.000Z',
        modified: '2026-01-01T00:00:00.123Z',
        progress: 0,
        phone: '00123',
        email: '',
      });
    });

    it.each([0.125, 1, 25, -0.5])(
      'keeps raw progress %s without multiplying, dividing or display formatting',
      (value) => {
        expect(convertRecord([field('p', 14)], record({ p: value })).p).toBe(value);
      }
    );

    it.each([15, 16])('preserves string whitespace and Unicode in type %i', (type) => {
      expect(convertRecord([field('s', type)], record({ s: '  测试@example.invalid  ' })).s).toBe(
        '  测试@example.invalid  '
      );
    });

    it.each([3, 12, 13, 14, 15, 16])(
      'preserves explicit null and maps only omitted native system-time cells for type %i',
      (type) => {
        for (const raw of [
          { recordID: 'r1', values: {} },
          { recordID: 'r1', values: { v: null } },
        ]) {
          expect(
            convertRecord([field('v', type)], { ...raw, createTime: '1767225600000', updateTime: '1767312000000' })
          ).toEqual({
            _record_id: 'r1',
            v:
              Object.keys(raw.values).length || ![12, 13].includes(type)
                ? null
                : type === 12
                ? '2026-01-01T00:00:00.000Z'
                : '2026-01-02T00:00:00.000Z',
          });
        }
      }
    );

    it.each([
      [3, 0],
      [3, 'false'],
      [3, 'true'],
      [3, {}],
      [12, 1767225600000],
      [12, '2026-01-01'],
      [12, '9999999999999999'],
      [12, '8640000000000001'],
      [13, 'private-invalid-timestamp'],
      [13, 'NaN'],
      [13, false],
      [13, []],
      [14, '25%'],
      [14, Infinity],
      [14, NaN],
      [14, true],
      [15, 123],
      [15, []],
      [16, ['email@example.invalid']],
      [16, {}],
    ])('rejects malformed restored type %i without disclosing values', (type, value) => {
      expect(() => convertRecord([field('v', type)], record({ v: value }))).toThrow('Invalid value');
      try {
        convertRecord([field('v', type)], record({ v: value }));
      } catch (error) {
        expect(String(error)).not.toContain('private-invalid');
      }
    });

    it('uses documented record metadata only for omitted native system-time types, never for ordinary dates or titles', () => {
      expect(
        convertRecord([field('created', 12), field('modified', 13), field('date', 4), field('createTime', 15)], {
          recordID: 'r1',
          createTime: '0',
          updateTime: '1767225600123',
          values: {},
        })
      ).toEqual({
        _record_id: 'r1',
        created: '1970-01-01T00:00:00.000Z',
        modified: '2026-01-01T00:00:00.123Z',
        date: null,
        createTime: null,
      });
    });

    it('does not override explicit system-time cells or explicit nulls with record metadata', () => {
      expect(
        convertRecord([field('created', 12), field('modified', 13)], {
          recordID: 'r1',
          createTime: 'invalid-unused',
          updateTime: '1767225600000',
          values: { created: '0', modified: null },
        })
      ).toEqual({ _record_id: 'r1', created: '1970-01-01T00:00:00.000Z', modified: null });
    });

    it.each([
      [12, 1767225600000],
      [12, 'invalid'],
      [13, false],
      [13, '8640000000000001'],
    ])('rejects malformed used system metadata for type %i', (type, value) => {
      expect(() =>
        convertRecord([field('v', type)], {
          recordID: 'r',
          values: {},
          [type === 12 ? 'createTime' : 'updateTime']: value,
        })
      ).toThrow('Invalid value');
    });

    it('still omits complex and undocumented types; never guesses currency/percentage enum IDs', () => {
      const result = supportedFields([
        field('number', 2),
        ...[5, 8, 9, 10, 11, 18, 999].map((type) => field(`unsupported-${type}`, type)),
      ]);
      expect(result).toEqual([field('number', 2)]);
    });

    it('does not assume old MCP string enums are native metadata', () => {
      for (const fieldType of [
        'checkbox',
        'createdTime',
        'modifiedTime',
        'currency',
        'percentage',
        'progress',
        'phoneNumber',
        'email',
      ]) {
        expect(() => supportedFields([{ fieldID: 'f', fieldTitle: 'v', fieldType }])).toThrow('Invalid field');
      }
    });

    it('rejects newly supported duplicate/reserved titles instead of silently renaming', () => {
      expect(() => supportedFields([field('CHECKED', 3), field('checked', 15)])).toThrow('Duplicate');
      expect(() => supportedFields([field('_RECORD_ID', 12)])).toThrow('reserved');
    });
  });

  function wire(invalidFinalPage = false, empty = false, systemMetadata = false) {
    const calls: Record<string, any>[] = [];
    const rows: { recordID: string; values: Record<string, unknown>; createTime?: string; updateTime?: string }[] = [
      {
        recordID: 'r1',
        values: {
          checked: false,
          created: '0',
          modified: '1767225600000',
          progress: 0.125,
          phone: '00123',
          email: 'qa@example.invalid',
        },
      },
      {
        recordID: 'r2',
        values: {
          checked: true,
          created: '1767225600000',
          modified: '1767312000000',
          progress: 0,
          phone: '',
          email: '',
        },
      },
      { recordID: 'r3', values: {} },
      { recordID: 'r4', values: Object.fromEntries(fields.map((f) => [f.fieldTitle, null])) },
    ];
    if (systemMetadata) {
      for (const row of rows) {
        row.createTime = '1767225600000';
        row.updateTime = '1767312000000';
        delete row.values.created;
        delete row.values.modified;
      }
    }
    if (invalidFinalPage) rows[3] = { recordID: 'r4', values: { checked: 'false' } };
    const metadata = [...definitions, field('image', 5)];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        expect(url).toBe('https://docs.qq.com/openapi/smartbook/v2/files/file/sheets/sheet');
        const request = JSON.parse(String(init.body));
        calls.push(request);
        const operation = Object.keys(request)[0];
        expect(['getFields', 'getRecords']).toContain(operation);
        const params = request[operation];
        const items = operation === 'getFields' ? metadata : empty ? [] : rows;
        if (operation === 'getRecords') expect(params.fieldTitles).toEqual(fields.map((f) => f.fieldTitle));
        const next = params.offset + Math.min(params.limit, items.length - params.offset);
        return Response.json({
          ret: 0,
          data: {
            [operation]: {
              [operation === 'getFields' ? 'fields' : 'records']: items.slice(params.offset, next),
              total: items.length,
              hasMore: next < items.length,
              next: next < items.length ? next : 0,
            },
          },
        });
      })
    );
    return calls;
  }
  const options = {
    fileId: 'file',
    sheetId: 'sheet',
    clientId: 'client',
    openId: 'open',
    accessToken: 'token',
    pageSize: 2,
  };

  describe('Tencent Docs restored scalars: native HTTP → formal loader → DuckDB', () => {
    it('loads a table containing only restored scalars, paginates, and preserves typed null/false/zero rows', async () => {
      const calls = wire();
      const ava = new AVA({ llm: { model: 'offline' } });
      try {
        await ava.source({ type: 'tencent-smartsheet', options });
        const schema = (await ava.schema()).models[0];
        expect(schema.columns.map((c) => [c.name, c.type])).toEqual([
          ['_record_id', 'VARCHAR'],
          ['checked', 'BOOLEAN'],
          ['created', 'TIMESTAMP WITH TIME ZONE'],
          ['modified', 'TIMESTAMP WITH TIME ZONE'],
          ['progress', 'DOUBLE'],
          ['phone', 'VARCHAR'],
          ['email', 'VARCHAR'],
        ]);
        expect(
          (await ava.query('SELECT _record_id, checked, progress, phone, email FROM data ORDER BY _record_id')).data
        ).toEqual([
          { _record_id: 'r1', checked: false, progress: 0.125, phone: '00123', email: 'qa@example.invalid' },
          { _record_id: 'r2', checked: true, progress: 0, phone: '', email: '' },
          { _record_id: 'r3', checked: null, progress: null, phone: null, email: null },
          { _record_id: 'r4', checked: null, progress: null, phone: null, email: null },
        ]);
        expect(
          (
            await ava.query(
              "SELECT epoch_ms(created) AS created_ms, epoch_ms(modified) AS modified_ms FROM data WHERE _record_id = 'r1'"
            )
          ).data
        ).toEqual([{ created_ms: 0, modified_ms: 1767225600000 }]);
        expect(calls.filter((r) => r.getRecords).map((r) => r.getRecords.offset)).toEqual([0, 2]);
        expect(calls.filter((r) => r.getFields).map((r) => r.getFields.offset)).toEqual([0, 2, 4, 6, 0, 2, 4, 6]);
      } finally {
        await ava.dispose();
      }
    });

    it('materializes the observed v2 record-level timestamps when native system fields omit values', async () => {
      wire(false, false, true);
      const ava = new AVA({ llm: { model: 'offline' } });
      try {
        await ava.source({ type: 'tencent-smartsheet', options });
        expect(
          (
            await ava.query(
              'SELECT count(*) AS total FROM data WHERE epoch_ms(created) = 1767225600000 AND epoch_ms(modified) = 1767312000000'
            )
          ).data
        ).toEqual([{ total: 4 }]);
      } finally {
        await ava.dispose();
      }
    });

    it('preserves explicit restored-column types in an empty table', async () => {
      wire(false, true);
      const ava = new AVA({ llm: { model: 'offline' } });
      try {
        await ava.source({ type: 'tencent-smartsheet', options });
        expect((await ava.query('SELECT * FROM data')).data).toEqual([]);
        expect((await ava.schema()).models[0].columns.find((c) => c.name === 'checked')?.type).toBe('BOOLEAN');
      } finally {
        await ava.dispose();
      }
    });

    it('rejects a bad restored cell on the final page without exposing a partial engine', async () => {
      wire(true);
      const ava = new AVA({ llm: { model: 'offline' } });
      try {
        await expect(ava.source({ type: 'tencent-smartsheet', options })).rejects.toThrow('Invalid value');
        expect(ava.engine).toBeNull();
      } finally {
        await ava.dispose();
      }
    });
  });
});

describe('native currency and percentage', () => {
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
});
