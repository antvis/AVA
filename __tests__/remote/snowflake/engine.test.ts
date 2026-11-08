import { Readable } from 'node:stream';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { SnowflakeEngine, SnowflakeQueryTimeoutError } from '../../../src/remote/snowflake';
import { convertRow, queryColumn } from '../../../src/remote/snowflake/result';
import { getLLMConfig } from '../../test-utils';

import { column, contextResponse, fakeConnection } from './test-utils';

import type { Column } from 'snowflake-sdk';
import type { SnowflakeSourceOptions } from '../../../src/types';
import type { ExecuteOptions, Response } from './test-utils';

const sdk = vi.hoisted(() => ({ createConnection: vi.fn(), configure: vi.fn() }));
vi.mock('snowflake-sdk', () => ({ default: sdk }));

const SOURCE = {
  type: 'snowflake' as const,
  options: {
    account: 'myorg-myaccount',
    username: 'AVA_READER_SVC',
    authenticator: 'SNOWFLAKE_JWT',
    privateKey: 'test-key',
    warehouse: 'AVA_WH',
    database: 'ANALYTICS',
    schema: 'SALES',
  },
};

function install(respond: (options: ExecuteOptions) => Response | undefined = () => undefined) {
  const fake = fakeConnection(respond);
  sdk.createConnection.mockReturnValue(fake.connection);
  return fake;
}

const COLUMN_ROWS = [
  ['CUSTOMERS', 'ID', 1, 'NO', 'NUMBER', null, 38, 0, null],
  ['CUSTOMERS', 'Region Name', 2, 'YES', 'TEXT', 16777216, null, null, null],
  ['ORDERS', 'ID', 1, 'NO', 'NUMBER', null, 38, 0, null],
  ['ORDERS', 'CUSTOMER_ID', 2, 'NO', 'NUMBER', null, 38, 0, null],
  ['ORDERS', 'AMOUNT', 3, 'YES', 'NUMBER', null, 12, 2, null],
  ['ORDERS', 'CODE', 4, 'YES', 'TEXT', 8, null, null, null],
  ['ORDERS', 'PLACED_AT', 5, 'YES', 'TIMESTAMP_NTZ', null, null, null, 9],
  ['ORDERS', 'PAYLOAD', 6, 'YES', 'VARIANT', null, null, null, null],
].map(([table, name, position, nullable, type, length, precision, scale, datetime]) => ({
  TABLE_NAME: table,
  COLUMN_NAME: name,
  ORDINAL_POSITION: String(position),
  IS_NULLABLE: nullable,
  DATA_TYPE: type,
  CHARACTER_MAXIMUM_LENGTH: length === null ? null : String(length),
  NUMERIC_PRECISION: precision === null ? null : String(precision),
  NUMERIC_SCALE: scale === null ? null : String(scale),
  DATETIME_PRECISION: datetime === null ? null : String(datetime),
}));

function catalog(options: ExecuteOptions): Response | undefined {
  if (options.sqlText.includes('INFORMATION_SCHEMA.COLUMNS')) {
    return {
      columns: [
        column('TABLE_NAME'),
        column('COLUMN_NAME'),
        column('ORDINAL_POSITION', 'fixed', 9),
        column('IS_NULLABLE'),
        column('DATA_TYPE'),
        column('CHARACTER_MAXIMUM_LENGTH', 'fixed', 9),
        column('NUMERIC_PRECISION', 'fixed', 9),
        column('NUMERIC_SCALE', 'fixed', 9),
        column('DATETIME_PRECISION', 'fixed', 9),
      ],
      rows: COLUMN_ROWS,
    };
  }
  if (options.sqlText.startsWith('SHOW PRIMARY KEYS')) {
    return {
      columns: [
        column('table_name'),
        column('column_name'),
        column('key_sequence', 'fixed'),
        column('constraint_name'),
      ],
      rows: [
        { table_name: 'CUSTOMERS', column_name: 'ID', key_sequence: '1', constraint_name: 'PK_CUSTOMERS' },
        { table_name: 'ORDERS', column_name: 'ID', key_sequence: '1', constraint_name: 'PK_ORDERS' },
        // A key on a table the role cannot see must not create a model.
        { table_name: 'HIDDEN', column_name: 'ID', key_sequence: '1', constraint_name: 'PK_HIDDEN' },
      ],
    };
  }
  if (options.sqlText.startsWith('SHOW UNIQUE KEYS')) {
    return {
      columns: [
        column('table_name'),
        column('column_name'),
        column('key_sequence', 'fixed'),
        column('constraint_name'),
      ],
      rows: [{ table_name: 'ORDERS', column_name: 'CODE', key_sequence: '1', constraint_name: 'UQ_ORDERS_CODE' }],
    };
  }
  if (options.sqlText.startsWith('SHOW IMPORTED KEYS')) {
    const fk = (name: string, pkSchema: string, pkTable: string) => ({
      fk_name: name,
      fk_table_name: 'ORDERS',
      fk_column_name: 'CUSTOMER_ID',
      pk_database_name: 'ANALYTICS',
      pk_schema_name: pkSchema,
      pk_table_name: pkTable,
      pk_column_name: 'ID',
      key_sequence: '1',
    });
    return {
      columns: [column('key_sequence', 'fixed')],
      rows: [fk('FK_ORDERS_CUSTOMER', 'SALES', 'CUSTOMERS'), fk('FK_ORDERS_ARCHIVE', 'ARCHIVE', 'CUSTOMERS')],
    };
  }
  return undefined;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('SnowflakeEngine loading', () => {
  it('connects with AVA-managed options, checks the session context and closes the session on dispose', async () => {
    const { connection, calls } = install();
    const engine = new SnowflakeEngine(getLLMConfig());
    await engine.load({
      type: 'snowflake',
      options: {
        ...SOURCE.options,
        rowMode: 'array',
        representNullAsStringNull: true,
        serverSessionKeepAlive: true,
      } as typeof SOURCE.options,
    });

    expect(sdk.configure).toHaveBeenCalledWith({ logLevel: 'OFF' });
    expect(sdk.createConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        account: 'myorg-myaccount',
        authenticator: 'SNOWFLAKE_JWT',
        database: 'ANALYTICS',
        schema: 'SALES',
        queryTag: 'AVA',
        jsTreatIntegerAsBigInt: false,
        representNullAsStringNull: false,
        serverSessionKeepAlive: false,
      })
    );
    expect(connection.connect).toHaveBeenCalledOnce();
    // Session limits and value formats are set once, right after login.
    const settings = calls[0].sqlText.replace(/\s+/g, ' ');
    for (const setting of [
      'MULTI_STATEMENT_COUNT = 1',
      'STATEMENT_TIMEOUT_IN_SECONDS = 30',
      'STATEMENT_QUEUED_TIMEOUT_IN_SECONDS = 30',
      'ABORT_DETACHED_QUERY = TRUE',
      'STRICT_JSON_OUTPUT = TRUE',
      "TIMESTAMP_TZ_OUTPUT_FORMAT = 'YYYY-MM-DD HH24:MI:SS.FF9 TZH:TZM'",
    ]) {
      expect(settings).toContain(setting);
    }
    expect(calls[1].sqlText).toContain('CURRENT_WAREHOUSE()');
    // Result shape is controlled per statement, regardless of connection options.
    expect(calls[1]).toMatchObject({ rowMode: 'object_with_renamed_duplicated_columns', streamResult: true });

    await engine.dispose();
    expect(connection.destroy).toHaveBeenCalledOnce();
    await engine.dispose();
    expect(connection.destroy).toHaveBeenCalledOnce();
  });

  it('defaults to the PUBLIC schema and keeps a caller query tag', async () => {
    install();
    const engine = new SnowflakeEngine(getLLMConfig());
    const options: SnowflakeSourceOptions = { ...SOURCE.options, queryTag: 'reports' };
    delete options.schema;
    await engine.load({ type: 'snowflake', options });
    expect(sdk.createConnection).toHaveBeenCalledWith(
      expect.objectContaining({ schema: 'PUBLIC', queryTag: 'reports' })
    );
    await engine.dispose();
  });

  it('reports login failures from the connect callback and releases the connection', async () => {
    const { connection } = install();
    connection.connect.mockImplementation((callback) => {
      setImmediate(() => callback(new Error('JWT token is invalid.'), connection));
      return connection;
    });
    const engine = new SnowflakeEngine(getLLMConfig());
    await expect(engine.load(SOURCE)).rejects.toThrow('JWT token is invalid.');
    expect(connection.destroy).toHaveBeenCalledOnce();
    await expect(engine.schema()).rejects.toThrow('No data loaded');
  });

  it.each([
    [
      { database: null, schema: null, warehouse: 'AVA_WH', role: 'AVA_READER' },
      'ANALYTICS.SALES does not exist or is not authorized for role AVA_READER',
    ],
    [
      { database: 'ANALYTICS', schema: null, warehouse: 'AVA_WH', role: 'AVA_READER' },
      'is not authorized for role AVA_READER',
    ],
    [
      { database: 'ANALYTICS', schema: 'SALES', warehouse: null, role: 'AVA_READER' },
      'No usable Snowflake warehouse for role AVA_READER',
    ],
  ])('fails at load time when the session context is incomplete %#', async (row, message) => {
    const { connection } = install((options) =>
      /CURRENT_DATABASE/.test(options.sqlText) ? contextResponse(row) : undefined
    );
    const engine = new SnowflakeEngine(getLLMConfig());
    await expect(engine.load(SOURCE)).rejects.toThrow(message);
    expect(connection.destroy).toHaveBeenCalledOnce();
  });

  it('rejects other source types and invalid timeouts before connecting', async () => {
    install();
    const engine = new SnowflakeEngine(getLLMConfig());
    await expect(engine.load({ type: 'csv-file', options: { path: 'unused' } })).rejects.toThrow('only supports');
    for (const queryTimeoutMs of [0, -1, 1.5, Number.NaN]) {
      await expect(engine.load({ type: 'snowflake', options: { ...SOURCE.options, queryTimeoutMs } })).rejects.toThrow(
        'queryTimeoutMs must be a positive integer'
      );
    }
    expect(sdk.createConnection).not.toHaveBeenCalled();
  });

  it('requires a loaded source for every operation', async () => {
    const engine = new SnowflakeEngine(getLLMConfig());
    await expect(engine.schema()).rejects.toThrow('No data loaded');
    await expect(engine.profile({ models: [] })).rejects.toThrow('No data loaded');
    await expect(engine.execute('SELECT 1')).rejects.toThrow('No data loaded');
    await expect(engine.getDSL('count rows', { models: [] })).rejects.toThrow('No data loaded');
  });
});

describe('SnowflakeEngine schema discovery', () => {
  it('reads one schema through INFORMATION_SCHEMA and SHOW keys within the authorized scope', async () => {
    const { calls } = install(catalog);
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await engine.load(SOURCE);
      const schema = await engine.schema();

      const columnsQuery = calls.find(({ sqlText }) => sqlText.includes('INFORMATION_SCHEMA.COLUMNS'))!;
      expect(columnsQuery.sqlText).toContain('FROM "ANALYTICS".INFORMATION_SCHEMA.COLUMNS');
      expect(columnsQuery.binds).toEqual(['SALES']);
      expect(calls.map(({ sqlText }) => sqlText)).toEqual(
        expect.arrayContaining([
          'SHOW PRIMARY KEYS IN SCHEMA "ANALYTICS"."SALES"',
          'SHOW UNIQUE KEYS IN SCHEMA "ANALYTICS"."SALES"',
          'SHOW IMPORTED KEYS IN SCHEMA "ANALYTICS"."SALES"',
        ])
      );
      expect(schema).toEqual({
        models: [
          {
            name: 'CUSTOMERS',
            tableReference: { catalog: 'ANALYTICS', schema: 'SALES', table: 'CUSTOMERS' },
            columns: [
              { name: 'ID', type: 'NUMBER(38,0)', notNull: true },
              { name: 'Region Name', type: 'VARCHAR', notNull: false },
            ],
            primaryKey: 'ID',
          },
          {
            name: 'ORDERS',
            tableReference: { catalog: 'ANALYTICS', schema: 'SALES', table: 'ORDERS' },
            columns: [
              { name: 'ID', type: 'NUMBER(38,0)', notNull: true },
              { name: 'CUSTOMER_ID', type: 'NUMBER(38,0)', notNull: true },
              { name: 'AMOUNT', type: 'NUMBER(12,2)', notNull: false },
              { name: 'CODE', type: 'VARCHAR(8)', notNull: false },
              { name: 'PLACED_AT', type: 'TIMESTAMP_NTZ(9)', notNull: false },
              { name: 'PAYLOAD', type: 'VARIANT', notNull: false },
            ],
            primaryKey: 'ID',
            uniqueKeys: ['CODE'],
          },
        ],
        relationships: [
          {
            name: 'FK_ORDERS_CUSTOMER',
            models: ['ORDERS', 'CUSTOMERS'],
            joinType: 'MANY_TO_ONE',
            condition: '"ORDERS"."CUSTOMER_ID" = "CUSTOMERS"."ID"',
          },
        ],
        views: [],
      });
    } finally {
      await engine.dispose();
    }
  });
});

describe('SnowflakeEngine execution', () => {
  const RESULT_COLUMNS = [column('REGION'), column('REVENUE', 'fixed', 38, 2)];
  const RESULT_ROWS = [
    { REGION: 'ASIA', REVENUE: '300.10' },
    { REGION: 'EUROPE', REVENUE: '200.00' },
    { REGION: 'AMERICA', REVENUE: '100.50' },
  ];

  it('compiles the statement as a subquery, then runs it unwrapped with Snowflake-side limits', async () => {
    const { calls } = install((options) =>
      options.sqlText.includes('REVENUE') && !options.describeOnly
        ? { columns: RESULT_COLUMNS, rows: RESULT_ROWS }
        : undefined
    );
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await engine.load({ type: 'snowflake', options: { ...SOURCE.options, queryTimeoutMs: 1500 } });
      const sql = 'SELECT "REGION", "REVENUE" FROM "ORDERS" ORDER BY "REVENUE" DESC; \n';
      const result = await engine.execute(sql, { maxRows: 2 });

      // queryTimeoutMs is rounded up to whole seconds for Snowflake.
      expect(calls[0].sqlText).toContain('STATEMENT_TIMEOUT_IN_SECONDS = 2');
      const [compile, run] = calls.slice(-2);
      expect(compile).toMatchObject({
        sqlText: 'SELECT * FROM (SELECT "REGION", "REVENUE" FROM "ORDERS" ORDER BY "REVENUE" DESC\n)',
        describeOnly: true,
      });
      expect(run).toMatchObject({
        sqlText: 'SELECT "REGION", "REVENUE" FROM "ORDERS" ORDER BY "REVENUE" DESC',
        describeOnly: false,
        fetchAsString: ['Number', 'Date', 'Buffer'],
        parameters: { MULTI_STATEMENT_COUNT: 1, ROWS_PER_RESULTSET: 3 },
      });
      expect(result).toEqual({
        schema: [
          { name: 'REGION', type: 'VARCHAR' },
          { name: 'REVENUE', type: 'NUMBER(38,2)' },
        ],
        data: [
          { REGION: 'ASIA', REVENUE: 300.1 },
          { REGION: 'EUROPE', REVENUE: 200 },
        ],
        truncated: true,
        truncatedBy: 'maxRows',
        rowCount: undefined,
      });
    } finally {
      await engine.dispose();
    }
  });

  it.each([
    { name: 'byte budget', value: '杭州', maxResultBytes: 23, error: false },
    { name: 'field budget', value: 'x'.repeat(1024 * 1024), maxResultBytes: 4 * 1024 * 1024, error: true },
  ])('stops reading at the $name and keeps the connection usable', async ({ value, maxResultBytes, error }) => {
    let emitted = 0;
    const stream = new Readable({
      objectMode: true,
      highWaterMark: 1,
      read() {
        this.push({ VALUE: value });
      },
    });
    const { calls } = install((options) => {
      if (options.sqlText !== 'SELECT VALUE FROM WIDE_TABLE' || options.describeOnly) return undefined;
      setImmediate(() =>
        options.complete(undefined, {
          getColumns: () => [column('VALUE')],
          streamRows: () => {
            stream.on('data', () => emitted++);
            return stream;
          },
        })
      );
      return 'hang';
    });
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await engine.load(SOURCE);
      const pending = engine.execute('SELECT VALUE FROM WIDE_TABLE', { maxResultBytes });
      if (error) {
        await expect(pending).rejects.toThrow('Result field exceeds the 1 MiB limit');
      } else {
        await expect(pending).resolves.toMatchObject({
          data: [{ VALUE: value }],
          truncated: true,
          truncatedBy: 'maxResultBytes',
          rowCount: undefined,
        });
      }
      // Node may emit one prefetched row after the stream is destroyed.
      expect(emitted).toBeLessThanOrEqual(error ? 2 : 3);
      expect(emitted).toBeGreaterThan(0);
      expect(stream.destroyed).toBe(true);
      await expect(engine.execute('SELECT 1')).resolves.toMatchObject({ data: [], rowCount: 0 });
      expect(calls.filter(({ describeOnly }) => describeOnly)).toHaveLength(2);
    } finally {
      stream.destroy();
      await engine.dispose();
    }
  });

  it('ignores an oversized sentinel row beyond maxRows', async () => {
    install((options) =>
      options.describeOnly
        ? undefined
        : options.sqlText === 'SELECT VALUE FROM WIDE_TABLE'
        ? { columns: [column('VALUE')], rows: [{ VALUE: 'ok' }, { VALUE: 'x'.repeat(1024 * 1024) }] }
        : undefined
    );
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await engine.load(SOURCE);
      await expect(engine.execute('SELECT VALUE FROM WIDE_TABLE', { maxRows: 1 })).resolves.toMatchObject({
        data: [{ VALUE: 'ok' }],
        truncated: true,
        truncatedBy: 'maxRows',
        rowCount: undefined,
      });
    } finally {
      await engine.dispose();
    }
  });

  it('serializes MAP columns and nested MAPs as JSON objects', async () => {
    const timestamp = new Date('2024-03-01T09:00:00Z');
    const map = new Map<string | number, unknown>([
      [1, 'one'],
      ['__proto__', 'kept'],
      ['empty', new Map()],
      ['nested', new Map([['value', null]])],
    ]);
    const expectedMap = { '1': 'one', ['__proto__']: 'kept', empty: {}, nested: { value: null } };
    install((options) =>
      options.sqlText === 'SELECT MAP_VALUES' && !options.describeOnly
        ? {
            columns: [column('MAP', 'map'), column('OBJECT', 'object'), column('ARRAY', 'array')],
            rows: [{ MAP: map, OBJECT: { map, timestamp }, ARRAY: [map, 0, false, null] }],
          }
        : undefined
    );
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await engine.load(SOURCE);
      const result = await engine.execute('SELECT MAP_VALUES');
      expect(result.data).toEqual([
        { MAP: expectedMap, OBJECT: { map: expectedMap, timestamp }, ARRAY: [expectedMap, 0, false, null] },
      ]);
      expect((result.data[0].OBJECT as { timestamp: Date }).timestamp).toBe(timestamp);
      expect(JSON.parse(JSON.stringify(result)).data).toEqual([
        {
          MAP: expectedMap,
          OBJECT: { map: expectedMap, timestamp: timestamp.toISOString() },
          ARRAY: [expectedMap, 0, false, null],
        },
      ]);
    } finally {
      await engine.dispose();
    }
  });

  it.each([
    { name: 'result', value: '杭州', maxResultBytes: 45, error: false },
    { name: 'field', value: 'x'.repeat(1024 * 1024), maxResultBytes: 4 * 1024 * 1024, error: true },
  ])('enforces the $name byte limit on nested MAP contents', async ({ value, maxResultBytes, error }) => {
    install((options) =>
      options.sqlText === 'SELECT MAP_VALUES' && !options.describeOnly
        ? {
            columns: [column('VALUE', 'map')],
            rows: Array.from({ length: 2 }, () => ({ VALUE: new Map([['nested', new Map([['value', value]])]]) })),
          }
        : undefined
    );
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await engine.load(SOURCE);
      const pending = engine.execute('SELECT MAP_VALUES', { maxResultBytes });
      if (error) {
        await expect(pending).rejects.toThrow('Result field exceeds the 1 MiB limit');
      } else {
        await expect(pending).resolves.toMatchObject({
          data: [{ VALUE: { nested: { value } } }],
          truncated: true,
          truncatedBy: 'maxResultBytes',
          rowCount: undefined,
        });
      }
    } finally {
      await engine.dispose();
    }
  });

  it('refuses unsafe statements before running anything', async () => {
    const { calls } = install();
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await engine.load(SOURCE);
      const before = calls.length;
      await expect(engine.execute('SELECT SYSTEM$CANCEL_ALL_QUERIES(1)')).rejects.toThrow('SYSTEM$');
      await expect(
        engine.execute("WITH p AS PROCEDURE () RETURNS VARCHAR LANGUAGE SQL AS $$ BEGIN RETURN 'x'; END $$ CALL p()")
      ).rejects.toThrow('procedures are not allowed');
      await expect(engine.execute(' ; ')).rejects.toThrow('one read-only SELECT');
      expect(calls.length).toBe(before);
    } finally {
      await engine.dispose();
    }
  });

  it('surfaces Snowflake compilation errors and never runs a statement that failed to compile', async () => {
    const { calls } = install((options) =>
      options.describeOnly
        ? { error: new Error("SQL compilation error: syntax error line 1 at position 15 unexpected 'DROP'.") }
        : undefined
    );
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await engine.load(SOURCE);
      await expect(engine.execute('DROP TABLE "ORDERS"')).rejects.toThrow("unexpected 'DROP'");
      expect(calls.filter(({ sqlText }) => sqlText.includes('DROP'))).toHaveLength(1);
      expect(calls[calls.length - 1].describeOnly).toBe(true);
    } finally {
      await engine.dispose();
    }
  });

  it('cancels a statement in Snowflake when it outlives queryTimeoutMs', async () => {
    const stream = new Readable({ objectMode: true, read() {} });
    const { statements } = install((options) => {
      if (!options.sqlText.includes('GENERATOR') || options.describeOnly) return undefined;
      options.complete(undefined, { getColumns: () => [], streamRows: () => stream });
      return 'hang';
    });
    const engine = new SnowflakeEngine(getLLMConfig());
    try {
      await engine.load({ type: 'snowflake', options: { ...SOURCE.options, queryTimeoutMs: 30 } });
      const error = await engine.execute('SELECT COUNT(*) FROM TABLE(GENERATOR(TIMELIMIT => 60))').catch((e) => e);
      expect(error).toBeInstanceOf(SnowflakeQueryTimeoutError);
      expect(error.message).toBe('Snowflake query timed out after 30ms and was cancelled');
      expect(statements[statements.length - 1].cancel).toHaveBeenCalledOnce();
      expect(stream.destroyed).toBe(true);
    } finally {
      stream.destroy();
      await engine.dispose();
    }
  });

  it('cancels running statements before closing the session', async () => {
    let complete: ExecuteOptions['complete'];
    const streamRows = vi.fn(() => Readable.from([]));
    const { connection, statements } = install((options) => {
      if (!options.sqlText.includes('GENERATOR') || options.describeOnly) return undefined;
      complete = options.complete;
      return 'hang';
    });
    const engine = new SnowflakeEngine(getLLMConfig());
    await engine.load(SOURCE);
    const pending = engine.execute('SELECT COUNT(*) FROM TABLE(GENERATOR(TIMELIMIT => 60))').catch((e) => e);
    // Session settings, context check, compilation, then the running statement.
    await vi.waitFor(() => expect(statements).toHaveLength(4));
    await engine.dispose();
    expect(statements[3].cancel).toHaveBeenCalledOnce();
    expect(statements[3].cancel.mock.invocationCallOrder[0]).toBeLessThan(
      connection.destroy.mock.invocationCallOrder[0]
    );
    complete(undefined, { getColumns: () => [], streamRows });
    expect(streamRows).not.toHaveBeenCalled();
    expect(await pending).toBeInstanceOf(Error);
  });

  it('integrates with AVA through the engine registry', async () => {
    install((options) =>
      options.sqlText.includes('REVENUE') && !options.describeOnly
        ? { columns: RESULT_COLUMNS, rows: RESULT_ROWS }
        : undefined
    );
    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'snowflake' } });
    try {
      await ava.source(SOURCE);
      expect(ava.engine?.dialect.id).toBe('snowflake-sql');
      expect(ava.engine?.dialect.rules).toContain('read-only SELECT');
      const result = await ava.query('SELECT "REGION", "REVENUE" FROM "ORDERS" ORDER BY "REVENUE" DESC');
      expect(result.data).toEqual([
        { REGION: 'ASIA', REVENUE: 300.1 },
        { REGION: 'EUROPE', REVENUE: 200 },
        { REGION: 'AMERICA', REVENUE: 100.5 },
      ]);
      expect(result.rowCount).toBe(3);
    } finally {
      await ava.dispose();
    }
  });
});

describe('Snowflake result values', () => {
  const columns = [
    column('BIG', 'fixed', 38, 0),
    column('PRICE', 'fixed', 12, 2),
    column('PRECISE', 'fixed', 38, 20),
    column('RATIO', 'real'),
    column('NAN', 'real'),
    column('DAY', 'date'),
    column('FLAG', 'boolean'),
    column('PAYLOAD', 'variant'),
    column('NAME_2'),
  ] as unknown as Column[];

  it('keeps exact numbers exact and converts only lossless values', () => {
    const row = convertRow(
      {
        BIG: '12345678901234567890',
        PRICE: '172799.49',
        PRECISE: '0.12345678901234567890',
        RATIO: '0.1',
        NAN: 'NaN',
        DAY: '1995-03-15',
        FLAG: true,
        PAYLOAD: { a: [1, 2] },
        NAME_2: null,
      },
      columns
    );
    expect(row).toEqual({
      BIG: '12345678901234567890',
      PRICE: 172799.49,
      PRECISE: '0.12345678901234567890',
      RATIO: 0.1,
      NAN: 'NaN',
      DAY: '1995-03-15',
      FLAG: true,
      PAYLOAD: { a: [1, 2] },
      NAME_2: null,
    });
  });

  it('reports Snowflake type names for result columns', () => {
    expect(columns.map((value) => queryColumn(value).type)).toEqual([
      'NUMBER(38,0)',
      'NUMBER(12,2)',
      'NUMBER(38,20)',
      'FLOAT',
      'FLOAT',
      'DATE',
      'BOOLEAN',
      'VARIANT',
      'VARCHAR',
    ]);
  });
});
