import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readTencentTable } from '../../../src/duckdb/loaders/tencent/read';

const mock = vi.hoisted(() => ({ connect: vi.fn(), call: vi.fn(), close: vi.fn() }));
vi.mock('../../../src/duckdb/loaders/tencent/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/duckdb/loaders/tencent/client')>();
  return {
    ...actual,
    TencentDocsClient: class {
      connect = mock.connect;
      call = mock.call;
      close = mock.close;
    },
  };
});

const field = { fieldID: 'f', fieldTitle: 'amount', fieldType: 2 };
const metadata = { fields: [field], hasMore: false, total: 1 };
const options = { fileId: 'file', sheetId: 'sheet', clientId: 'client', openId: 'open', accessToken: 'test-secret' };

beforeEach(() => {
  vi.resetAllMocks();
  mock.close.mockResolvedValue(undefined);
  for (const key of ['CLIENT_ID', 'OPEN_ID', 'ACCESS_TOKEN']) vi.stubEnv(`TENCENT_DOCS_${key}`, undefined);
  mock.call.mockImplementation(async (tool: string) =>
    tool === 'getFields'
      ? metadata
      : {
          records: [{ recordID: 'r', values: { amount: 42 } }],
          total: 1,
          hasMore: false,
        }
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('Tencent Docs read orchestration', () => {
  it('reads projected fields, converts rows and rechecks metadata using only read tools', async () => {
    expect(await readTencentTable(options)).toEqual({ fields: [field], rows: [{ _record_id: 'r', amount: 42 }] });
    expect(mock.connect).toHaveBeenCalledWith({ clientId: 'client', openId: 'open', accessToken: 'test-secret' });
    expect(mock.call.mock.calls.map((call) => call[0])).toEqual(['getFields', 'getRecords', 'getFields']);
    expect(mock.call.mock.calls[1][1]).toMatchObject({ fieldTitles: ['amount'], offset: 0, limit: 100 });
    expect(mock.close).toHaveBeenCalledOnce();
  });

  it('resolves all three credentials from the environment with explicit option precedence', async () => {
    vi.stubEnv('TENCENT_DOCS_CLIENT_ID', 'env-client');
    vi.stubEnv('TENCENT_DOCS_OPEN_ID', 'env-open');
    vi.stubEnv('TENCENT_DOCS_ACCESS_TOKEN', 'env-token');
    await readTencentTable({ fileId: 'file', sheetId: 'sheet' });
    expect(mock.connect).toHaveBeenLastCalledWith({
      clientId: 'env-client',
      openId: 'env-open',
      accessToken: 'env-token',
    });
    await readTencentTable(options);
    expect(mock.connect).toHaveBeenLastCalledWith({ clientId: 'client', openId: 'open', accessToken: 'test-secret' });
  });

  it.each([
    { ...options, token: 'obsolete-mcp-token' },
    { ...options, pageSize: 101 },
    { ...options, maxRecords: 0 },
    { ...options, maxRetries: 6 },
    { ...options, timeoutMs: Infinity },
    { ...options, fileId: '' },
  ])('validates credentials and bounds before connecting', async (config) => {
    await expect(readTencentTable(config)).rejects.toThrow();
    expect(mock.connect).not.toHaveBeenCalled();
  });

  it('rejects metadata changes between the first and last page', async () => {
    mock.call
      .mockResolvedValueOnce(metadata)
      .mockResolvedValueOnce({ records: [], total: 0, hasMore: false })
      .mockResolvedValueOnce({ ...metadata, fields: [{ ...field, fieldTitle: 'renamed' }] });
    await expect(readTencentTable(options)).rejects.toThrow('metadata changed');
    expect(mock.close).toHaveBeenCalledOnce();
  });

  it('clears the deadline and closes even when connection or reads fail', async () => {
    vi.useFakeTimers();
    mock.connect.mockRejectedValue(new Error('authentication failed'));
    mock.close.mockRejectedValue(new Error('cleanup failure'));
    await expect(readTencentTable(options)).rejects.toThrow('authentication failed');
    expect(mock.close).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not lose the loading error when transport cleanup also fails', async () => {
    mock.call.mockRejectedValue(new Error('pagination failed'));
    mock.close.mockRejectedValue(new Error('cleanup failed'));
    await expect(readTencentTable(options)).rejects.toThrow('pagination failed');
    expect(mock.close).toHaveBeenCalledOnce();
  });

  it('rejects sparse expansion bombs using the first record-page total, before conversion', async () => {
    const fields = Array.from({ length: 1000 }, (_, i) => ({
      fieldID: `f${i}`,
      fieldTitle: `c${i}`,
      fieldType: 2,
    }));
    mock.call.mockImplementation(async (tool: string, args: { offset: number }) =>
      tool === 'getFields'
        ? {
            fields: fields.slice(args.offset, args.offset + 100),
            total: 1000,
            hasMore: args.offset + 100 < 1000,
            next: args.offset + 100,
          }
        : { records: [{ recordID: 'empty', values: {} }], total: 100000, hasMore: true, next: 1 }
    );
    await expect(readTencentTable({ ...options, maxRecords: 100000 })).rejects.toThrow('read limit');
    expect(mock.call.mock.calls.filter((call) => call[0] === 'getRecords')).toHaveLength(1);
    expect(mock.close).toHaveBeenCalledOnce();
  });
});
