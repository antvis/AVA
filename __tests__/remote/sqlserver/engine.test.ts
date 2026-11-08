import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { SQLServerEngine } from '../../../src/remote/sqlserver';

// Node's ESM loader exposes mssql's ConnectionPool only on the default export, so the mock does too.
const { ConnectionPool } = vi.hoisted(() => ({ ConnectionPool: vi.fn() }));
vi.mock('mssql', () => ({ default: { ConnectionPool } }));

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

  it('executes bounded queries through AVA', async () => {
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
