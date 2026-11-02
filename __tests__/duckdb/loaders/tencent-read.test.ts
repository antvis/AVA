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

const field = { field_id: 'f', field_title: 'amount', field_type: 'number' };
const metadata = { fields: [field], has_more: false, total: 1 };
const options = { fileId: 'file', sheetId: 'sheet', token: 'test-secret' };

beforeEach(() => {
  vi.resetAllMocks();
  mock.close.mockResolvedValue(undefined);
  vi.stubEnv('TENCENT_DOCS_TOKEN', undefined);
  mock.call.mockImplementation(async (tool: string) =>
    tool === 'smartsheet.list_fields'
      ? metadata
      : {
          records: [{ record_id: 'r', field_values: [{ field: 'amount', number_value: 42 }] }],
          total: 1,
          has_more: false,
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
    expect(mock.connect).toHaveBeenCalledWith('test-secret');
    expect(mock.call.mock.calls.map((call) => call[0])).toEqual([
      'smartsheet.list_fields',
      'smartsheet.list_records',
      'smartsheet.list_fields',
    ]);
    expect(mock.call.mock.calls[1][1]).toMatchObject({ field_titles: ['amount'], offset: 0, limit: 100 });
    expect(mock.close).toHaveBeenCalledOnce();
  });

  it('resolves a token from the environment, while an explicit token takes precedence', async () => {
    vi.stubEnv('TENCENT_DOCS_TOKEN', 'env-token');
    await readTencentTable({ fileId: 'file', sheetId: 'sheet' });
    expect(mock.connect).toHaveBeenLastCalledWith('env-token');
    await readTencentTable(options);
    expect(mock.connect).toHaveBeenLastCalledWith('test-secret');
  });

  it.each([
    { fileId: 'file', sheetId: 'sheet' },
    { ...options, token: 'line\nbreak' },
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
      .mockResolvedValueOnce({ records: [], total: 0, has_more: false })
      .mockResolvedValueOnce({ ...metadata, fields: [{ ...field, field_title: 'renamed' }] });
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
      field_id: `f${i}`,
      field_title: `c${i}`,
      field_type: 'number',
    }));
    mock.call.mockImplementation(async (tool: string, args: { offset: number }) =>
      tool === 'smartsheet.list_fields'
        ? {
            fields: fields.slice(args.offset, args.offset + 100),
            total: 1000,
            has_more: args.offset + 100 < 1000,
            next: args.offset + 100,
          }
        : { records: [{ record_id: 'empty', field_values: [] }], total: 100000, has_more: true, next: 1 }
    );
    await expect(readTencentTable({ ...options, maxRecords: 100000 })).rejects.toThrow('read limit');
    expect(mock.call.mock.calls.filter((call) => call[0] === 'smartsheet.list_records')).toHaveLength(1);
    expect(mock.close).toHaveBeenCalledOnce();
  });
});
