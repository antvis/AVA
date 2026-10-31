import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConnectionPool } from 'mssql';

import { AVA } from '../../../src';
import { SQLServerEngine } from '../../../src/remote/sqlserver';

vi.mock('mssql', () => ({ ConnectionPool: vi.fn() }));

const source = {
  type: 'sqlserver' as const,
  options: { host: 'localhost', database: 'sales', user: 'reader', password: 'test-password' },
};
const columns = [
  { name: 'id', type: { declaration: 'int' } },
  { name: 'amount', type: { declaration: 'decimal' } },
];

function queryResult(rows: Record<string, unknown>[], metadata = columns) {
  const recordset = Object.assign([...rows], {
    columns: Object.fromEntries(metadata.map((column) => [column.name, column])),
  });
  return { recordset };
}

function requestStub(result = queryResult([])) {
  return { query: vi.fn().mockResolvedValue(result), cancel: vi.fn() };
}

function poolStub(request = requestStub()) {
  const pool = {
    on: vi.fn(), connect: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined),
    request: vi.fn(() => request),
  };
  vi.mocked(ConnectionPool).mockImplementation(class { constructor() { return pool; } } as never);
  return pool;
}

function catalogRow(kind: string, table: string, metadata: Record<string, unknown>) {
  return { kind, table_name: `[dbo].[${table}]`, source_table: table, metadata: JSON.stringify(metadata) };
}

let engine: SQLServerEngine | undefined;
let ava: AVA | undefined;

afterEach(async () => {
  await ava?.dispose();
  await engine?.dispose();
  ava = undefined;
  engine = undefined;
  vi.clearAllMocks();
});

describe('SQLServerEngine', () => {
  it('requires a loaded SQL Server source', async () => {
    engine = new SQLServerEngine({ model: 'unused' });
    await expect(engine.load({ type: 'json', options: { data: [] } })).rejects.toThrow('only supports');
    await expect(engine.schema()).rejects.toThrow('No data loaded');
    await expect(engine.profile({ models: [] })).rejects.toThrow('No data loaded');
    await expect(engine.getDSL('question', { models: [] })).rejects.toThrow('No data loaded');
    await expect(engine.execute('SELECT 1')).rejects.toThrow('No data loaded');
  });

  it('maps connection settings and releases replaced pools', async () => {
    const previous = poolStub();
    engine = new SQLServerEngine({ model: 'unused' });
    await engine.load(source);
    expect(ConnectionPool).toHaveBeenCalledWith(expect.objectContaining({
      server: 'localhost', database: 'sales', user: 'reader', password: 'test-password',
      port: 1433, connectionTimeout: 10000, requestTimeout: 30000,
      options: { encrypt: true, trustServerCertificate: false },
    }));
    expect(previous.connect).toHaveBeenCalledOnce();

    const next = poolStub();
    await engine.load({ type: 'sqlserver', options: { ...source.options, port: 11433, encrypt: false,
      trustServerCertificate: true, connectionTimeoutMs: 4000, requestTimeoutMs: 8000 } });
    expect(previous.close).toHaveBeenCalledOnce();
    expect(next.connect).toHaveBeenCalledOnce();
    expect(ConnectionPool).toHaveBeenLastCalledWith(expect.objectContaining({
      port: 11433, connectionTimeout: 4000, requestTimeout: 8000,
      options: { encrypt: false, trustServerCertificate: true },
    }));
    await engine.dispose();
    await engine.dispose();
    expect(next.close).toHaveBeenCalledOnce();
  });

  it('discovers physical table references and schema-qualified relations through the driver', async () => {
    const rows = [
      catalogRow('table', 'customers', { catalog: 'sales', schema: 'dbo' }),
      catalogRow('table', 'orders', { catalog: 'sales', schema: 'dbo' }),
      catalogRow('column', 'customers', { name: 'id', type: 'int', position: 1 }),
      catalogRow('column', 'orders', { name: 'customer_id', type: 'int', position: 1 }),
      catalogRow('index-column', 'customers', { name: 'pk_customers', column: 'id', position: 1, unique: true, primary: true }),
      catalogRow('foreign-key-column', 'orders', {
        name: 'fk_customer', column: 'customer_id', position: 1, referencedTable: '[dbo].[customers]', referencedColumn: 'id',
      }),
    ];
    const request = requestStub(queryResult(rows));
    poolStub(request);
    engine = new SQLServerEngine({ model: 'unused' });
    await engine.load(source);
    const schema = await engine.schema();
    expect(request.query).toHaveBeenCalledOnce();
    expect(schema.models.map((model) => model.name)).toEqual(['[dbo].[customers]', '[dbo].[orders]']);
    expect(schema.models[0]).toMatchObject({
      tableReference: { catalog: 'sales', schema: 'dbo', table: 'customers' }, primaryKey: 'id',
    });
    expect(schema.relationships).toEqual([{
      name: 'fk_customer', models: ['[dbo].[orders]', '[dbo].[customers]'], joinType: 'MANY_TO_ONE',
      condition: '[dbo].[orders]."customer_id" = [dbo].[customers]."id"',
    }]);
  });

  it('profiles through AVA with shared defaults and reuses the discovered schema', async () => {
    const rows = [
      catalogRow('table', 'samples', { catalog: 'sales', schema: 'dbo' }),
      catalogRow('column', 'samples', { name: 'n', type: 'int', position: 1 }),
      catalogRow('column', 'samples', { name: 'category', type: 'nvarchar(20)', position: 2 }),
    ];
    const request = requestStub();
    request.query
      .mockResolvedValueOnce(queryResult(rows))
      .mockResolvedValueOnce(
        queryResult([
          {
            m0: '4',
            m1: 1,
            m2: 2,
            m3: 1,
            m4: 2,
            m5: 1.5,
            m6: 0,
            m7: 2,
            m8: '[{"value":"A","count":2},{"value":"B","count":2}]',
          },
        ])
      )
      .mockResolvedValueOnce(queryResult([{ m0: 4 }]));
    poolStub(request);
    ava = new AVA({ llm: { model: 'unused' }, engine: { type: 'sqlserver' } });
    await ava.source(source);
    const profile = await ava.profile();
    expect(profile.models[0]).toEqual({
      name: '[dbo].[samples]',
      metrics: { row_count: 4 },
      columns: [
        {
          name: 'n',
          properties: { logicalType: 'numeric' },
          metrics: { null_count: 1, distinct_count: 2, min: 1, max: 2, mean: 1.5 },
        },
        {
          name: 'category',
          properties: { logicalType: 'string' },
          metrics: {
            null_count: 0,
            distinct_count: 2,
            top_values: [
              { value: 'A', count: 2 },
              { value: 'B', count: 2 },
            ],
          },
        },
      ],
    });
    expect(request.query).toHaveBeenCalledTimes(2);
    expect(request.query.mock.calls[1][0]).not.toContain('SET ROWCOUNT');
    await ava.profile({ metrics: [] });
    expect(request.query).toHaveBeenCalledTimes(2);
    expect((await ava.profile({ metrics: ['row_count'] })).models[0].metrics).toEqual({ row_count: 4 });
    expect(request.query).toHaveBeenCalledTimes(3);
    expect((await ava.schema()).models[0].columns[0]).toEqual({ name: 'n', type: 'int' });
  });

  it('validates profile selections and rejects profiling after disposal', async () => {
    const request = requestStub();
    poolStub(request);
    engine = new SQLServerEngine({ model: 'unused' });
    await engine.load(source);
    await expect(engine.profile({ models: [] }, { metrics: ['missing'] })).rejects.toThrow('Unknown metric');
    await expect(engine.profile({ models: [] }, { metrics: [{ id: 'top_values', limit: -1 }] })).rejects.toThrow(
      'top_values.limit'
    );
    expect(request.query).not.toHaveBeenCalled();
    await engine.dispose();
    await expect(engine.profile({ models: [] })).rejects.toThrow('No data loaded');
  });

  it('executes bounded read-only queries through AVA', async () => {
    const request = requestStub(queryResult([{ id: 1, amount: 1.5 }, { id: 2, amount: 2 }, { id: 3, amount: 3 }]));
    poolStub(request);
    ava = new AVA({ llm: { model: 'unused' }, engine: { type: 'sqlserver' } });
    await ava.source(source);
    const query = 'SELECT id, amount FROM orders ORDER BY id';
    expect(await ava.query(query, { maxRows: 2 })).toEqual({
      data: [{ id: 1, amount: 1.5 }, { id: 2, amount: 2 }],
      schema: [{ name: 'id', type: 'int' }, { name: 'amount', type: 'decimal' }],
      truncated: true, truncatedBy: 'maxRows', rowCount: undefined,
    });
    expect(request.query).toHaveBeenCalledWith(`SET ROWCOUNT 3;\n${query}`);
    await expect(ava.query('DELETE FROM orders')).rejects.toThrow('read-only SELECT');
    expect(request.query).toHaveBeenCalledOnce();
  });

  it('preserves native column metadata when no rows are returned', async () => {
    const metadata = [{ name: 'value', type: { declaration: 'nvarchar' } }];
    poolStub(requestStub(queryResult([], metadata)));
    engine = new SQLServerEngine({ model: 'unused' });
    await engine.load(source);
    expect(await engine.execute('SELECT value FROM orders WHERE 1=0')).toEqual({
      data: [], schema: [{ name: 'value', type: 'nvarchar' }], rowCount: 0,
    });
  });

  it('propagates query errors and permits a subsequent query', async () => {
    const request = requestStub(queryResult([{ id: 1 }], [columns[0]]));
    request.query.mockRejectedValueOnce(Object.assign(new Error('query failed'), { code: 'ETIMEOUT' }));
    poolStub(request);
    engine = new SQLServerEngine({ model: 'unused' });
    await engine.load(source);
    await expect(engine.execute('SELECT 1')).rejects.toMatchObject({ code: 'ETIMEOUT' });
    expect((await engine.execute('SELECT 1')).rowCount).toBe(1);
  });

  it('cancels an active query and closes its pool on dispose', async () => {
    let rejectQuery: (error: Error) => void;
    const request = requestStub();
    request.query.mockImplementation(() => new Promise((_, reject) => { rejectQuery = reject; }));
    request.cancel.mockImplementation(() => rejectQuery(Object.assign(new Error('Canceled'), { code: 'ECANCEL' })));
    const pool = poolStub(request);
    engine = new SQLServerEngine({ model: 'unused' });
    await engine.load(source);
    const rejected = expect(engine.execute('SELECT 1')).rejects.toMatchObject({ code: 'ECANCEL' });
    await vi.waitFor(() => expect(request.query).toHaveBeenCalled());
    await engine.dispose();
    await rejected;
    expect(request.cancel).toHaveBeenCalledOnce();
    expect(pool.close).toHaveBeenCalledOnce();
  });
});
