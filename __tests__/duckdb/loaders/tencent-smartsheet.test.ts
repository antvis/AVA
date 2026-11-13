import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { run as runSource } from '../../../src/cli/commands/source';
import { createSession } from '../../../src/cli/session/client';
import { sourceInputSchema } from '../../../src/contracts';
import { loadTencentSmartsheet } from '../../../src/duckdb/loaders/tencent-smartsheet';
import { TencentSmartsheetClient, TencentSmartsheetError } from '../../../src/duckdb/loaders/tencent-smartsheet/client';
import { tencentSmartsheetOptionsSchema } from '../../../src/contracts/source/tencent-smartsheet';
import { columnTypes, createRecordConverter, supportedFields } from '../../../src/duckdb/loaders/tencent-smartsheet/convert';
import { readFields, readRecords, readTencentSmartsheet } from '../../../src/duckdb/loaders/tencent-smartsheet/read';
import { createSnapshotBuilder } from '../../../src/duckdb/loaders/tencent-smartsheet/snapshot';
import sales from '../../fixtures/tencent-sales.json';

import type { TencentSmartsheetField } from '../../../src/duckdb/loaders/tencent-smartsheet/convert';

// Mock only HTTP and CLI session creation, never the reader/converter/loader under test.
vi.mock('../../../src/cli/session/client', () => ({ createSession: vi.fn() }));
const credentials = { clientId: 'fake-client', openId: 'fake-open', accessToken: 'fake-secret' };
const options = { fileId: 'file', sheetId: 'sheet', ...credentials, pageSize: 2 };
const field = (fieldTitle: string, fieldType: number): TencentSmartsheetField => ({ fieldID: fieldTitle, fieldTitle, fieldType });
const record = (recordID: string, values: Record<string, unknown> = {}) => ({ recordID, values });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.useRealTimers();
});

function serveTable(fields: TencentSmartsheetField[], records: unknown[]) {
  const requests: Record<string, any>[] = [];
  const fetch = vi.fn(async (_url, init) => {
    const request = JSON.parse(String(init.body));
    requests.push(request);
    const operation = Object.keys(request)[0];
    expect(['getFields', 'getRecords']).toContain(operation);
    const args = request[operation];
    const key = operation === 'getFields' ? 'fields' : 'records';
    const items = key === 'fields' ? fields : records;
    if (key === 'records') expect(args.fieldTitles).toEqual(supportedFields(fields).map((f) => f.fieldTitle));
    return Response.json({
      ret: 0,
      data: {
        [operation]: {
          [key]: items.slice(args.offset, args.offset + args.limit),
          total: items.length,
          hasMore: args.offset + args.limit < items.length,
          next: args.offset + args.limit,
        },
      },
    });
  });
  vi.stubGlobal('fetch', fetch);
  return { fetch, requests };
}

describe('transport', () => {
  const args = { fileId: 'file', sheetId: 'sheet', offset: 0, limit: 2 };
  const success = () => Response.json({ ret: 0, data: { getFields: { fields: [], total: 0, hasMore: false } } });
  const client = (maxRetries = 0, signal = new AbortController().signal) =>
    new TencentSmartsheetClient(credentials, signal, maxRetries);

  it('sends explicit credentials only to the fixed, encoded, read-only endpoint', async () => {
    const fetch = vi.fn().mockResolvedValue(success());
    vi.stubGlobal('fetch', fetch);
    await client().call('getFields', { ...args, fileId: 'file/one', sheetId: 'sheet two' });
    expect(fetch).toHaveBeenCalledWith(
      'https://docs.qq.com/openapi/smartbook/v2/files/file%2Fone/sheets/sheet%20two',
      expect.objectContaining({
        method: 'POST',
        redirect: 'error',
        headers: {
          'Access-Token': 'fake-secret',
          'Client-Id': 'fake-client',
          'Open-Id': 'fake-open',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ getFields: { offset: 0, limit: 2 } }),
      })
    );
    await expect(client().call('addRecords' as never, args)).rejects.toThrow('Only SmartSheet');
    await expect(client().call('getRecords', {})).rejects.toThrow('Explicit native');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403, 429, 500, 502, 503, 504])('preserves HTTP %i, upstream ret/msg and request ID', async (status) => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json({ ret: 123, msg: 'Permission denied' }, { status, headers: { 'x-request-id': 'request-123' } })
      );
    vi.stubGlobal('fetch', fetch);
    const error = await client()
      .call('getFields', args)
      .catch((error) => error);
    expect(error).toBeInstanceOf(TencentSmartsheetError);
    expect(error).toMatchObject({
      code: 123,
      status,
      cause: { ret: 123, msg: 'Permission denied', requestId: 'request-123' },
    });
    expect(error.message).toContain('Permission denied');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403, 200])('does not retry authorization/business errors (HTTP %i)', async (status) => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ ret: 123, msg: 'Denied' }, { status }));
    vi.stubGlobal('fetch', fetch);
    await expect(client(2).call('getFields', args)).rejects.toMatchObject({ code: 123, status });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries a transient HTTP error within budget and honors Retry-After', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '0' } }))
      .mockResolvedValueOnce(success());
    vi.stubGlobal('fetch', fetch);
    await client(1).call('getFields', args);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each(['3600', 'invalid'])('does not wait for an excessive/invalid Retry-After: %s', async (value) => {
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 429, headers: { 'Retry-After': value } }));
    vi.stubGlobal('fetch', fetch);
    await expect(client(2).call('getFields', args)).rejects.toMatchObject({ status: 429 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('bounds network retries and stops retry waits on cancellation', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network unavailable'));
    vi.stubGlobal('fetch', fetch);
    await expect(client(1).call('getFields', args)).rejects.toThrow('network unavailable');
    expect(fetch).toHaveBeenCalledTimes(2);
    const controller = new AbortController();
    fetch.mockResolvedValue(new Response('', { status: 429 }));
    const pending = client(2, controller.signal).call('getFields', args);
    controller.abort();
    await expect(pending).rejects.toThrow('deadline exceeded');
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('retains useful network diagnostics without copying arbitrary nested objects', async () => {
    const cause = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
    const failure = Object.assign(new Error('fetch failed fake-secret'), { cause, headers: credentials });
    const fetch = vi.fn().mockRejectedValue(failure);
    vi.stubGlobal('fetch', fetch);
    const error = await client()
      .call('getFields', args)
      .catch((error) => error);
    expect(error.cause).toMatchObject({
      message: 'fetch failed [REDACTED]',
      cause: { message: 'connect ECONNREFUSED', code: 'ECONNREFUSED' },
    });
    expect(JSON.stringify(error.cause)).not.toContain('fake-secret');
    expect(error.cause).not.toHaveProperty('headers');
  });

  it('keeps only documented HTTP diagnostics and redacts exact credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { ret: 1, msg: 'Denied fake-client fake-open fake-secret', data: { credentials } },
            { status: 403, headers: { 'x-request-id': 'request-123' } }
          )
        )
    );
    const error = await client()
      .call('getFields', args)
      .catch((error) => error);
    expect(error.cause).toEqual({ ret: 1, msg: 'Denied [REDACTED] [REDACTED] [REDACTED]', requestId: 'request-123' });
    expect(error.message).not.toContain('fake-secret');
  });

  it.each([200, 403])('does not emit partial or oversized diagnostics (HTTP %i)', async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ ret: 1, msg: '中'.repeat(8192) + 'fake-secret' }, { status }))
    );
    const error = await client()
      .call('getFields', args)
      .catch((error) => error);
    expect(error).toMatchObject({ status });
    expect(error.message).not.toContain('中');
    expect(error.message).not.toContain('fake-secret');
    expect(Buffer.byteLength(error.message)).toBeLessThan(512);
    expect(JSON.stringify(error.cause)).not.toContain('fake-secret');
  });

  it('omits a stalled non-JSON body at the byte budget but retains HTTP status/request ID', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('x'.repeat(8175) + 'fake-secret-prefix'));
      },
      cancel,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(body, { status: 403, headers: { 'x-request-id': 'request-123' } }))
    );
    const error = await client()
      .call('getFields', args)
      .catch((error) => error);
    expect(error).toMatchObject({ status: 403, cause: { requestId: 'request-123' } });
    expect(error.message).not.toContain('fake-secret');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('bounds successful responses and aborts a stalled response body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x'.repeat(16 * 1024 * 1024 + 1))));
    await expect(client().call('getFields', args)).rejects.toThrow('16 MiB');
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new ReadableStream({}))));
    const pending = client(0, controller.signal).call('getFields', args);
    controller.abort();
    await expect(pending).rejects.toThrow('deadline exceeded');
  });

  it.each([{}, { ret: 0 }, { ret: 0, data: { getFields: [] } }])('rejects invalid response envelopes', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));
    await expect(client().call('getFields', args)).rejects.toThrow('Invalid OpenAPI response');
  });

  it.each(['clientId', 'openId', 'accessToken'] as const)('validates %s before any request', (key) => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    for (const value of ['', 'line\nbreak', 'non-ascii中'])
      expect(() => new TencentSmartsheetClient({ ...credentials, [key]: value }, new AbortController().signal, 0)).toThrow(
        `valid ${key}`
      );
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('pagination', () => {
  const args = { fileId: 'file', sheetId: 'sheet', fieldTitles: [] };
  const row = (recordID: string) => ({ recordID, values: {} });

  function read(pages: unknown[], maximum = 100) {
    const call = vi.fn();
    pages.forEach((page) => call.mockResolvedValueOnce(page));
    const rows: unknown[] = [];
    return { call, result: readRecords({ call }, args, 2, maximum, (row) => rows.push(row)).then(() => rows) };
  }

  it('consumes validated records before fetching the next page without retaining raw records', async () => {
    const consume = vi.fn();
    const call = vi
      .fn()
      .mockResolvedValueOnce({ records: [row('r1')], total: 2, hasMore: true, next: 1 })
      .mockImplementationOnce(async () => {
        expect(consume).toHaveBeenCalledExactlyOnceWith(row('r1'));
        return { records: [row('r2')], total: 2, hasMore: false, next: 0 };
      });
    expect(await readRecords({ call }, args, 2, 100, consume)).toBeUndefined();
    expect(consume.mock.calls.map((call) => call[0])).toEqual([row('r1'), row('r2')]);
  });

  it('follows the explicit next offset through a short final page', async () => {
    const { call, result } = read([
      { records: [row('r1'), row('r2')], total: 3, hasMore: true, next: 2 },
      { records: [row('r3')], total: 3, hasMore: false, next: 0 },
    ]);
    expect(await result).toHaveLength(3);
    expect(call.mock.calls.map((c) => c[1].offset)).toEqual([0, 2]);
  });

  it('accepts a genuinely empty table', async () => {
    expect(await read([{ records: [], total: 0, hasMore: false }]).result).toEqual([]);
  });

  it.each([
    [{ records: [row('a')], total: 2, hasMore: false }],
    [{ records: [], total: 2, hasMore: true, next: 0 }],
    [{ records: [row('a')], total: 2, hasMore: true, next: 0 }],
    [{ records: [row('a')], total: 2, hasMore: true, next: 2 }],
    [{ records: [row('a')], total: 0, hasMore: false }],
    [{ records: [row('a')], hasMore: false }],
    [{ records: [row('a')], total: 1, hasMore: 'false' }],
    [{ records: [row('a'), row('a')], total: 2, hasMore: false }],
    [{ records: [row('a'), row('b'), row('c')], total: 3, hasMore: false }],
    [
      { records: [row('a')], total: 2, hasMore: true, next: 1 },
      { records: [row('a')], total: 2, hasMore: false },
    ],
    [
      { records: [row('a')], total: 2, hasMore: true, next: 1 },
      { records: [row('b')], total: 3, hasMore: false },
    ],
  ])('rejects incomplete, repeated or inconsistent pages', async (...pages) => {
    await expect(read(pages).result).rejects.toThrow('Tencent Docs');
  });

  it('rejects oversized snapshots before fetching more pages', async () => {
    const { result, call } = read([{ records: [row('a')], total: 3, hasMore: true, next: 1 }], 2);
    await expect(result).rejects.toThrow('read limit');
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('rejects cumulative page bytes over 16 MiB instead of returning a truncated snapshot', async () => {
    const payload = 'x'.repeat(8 * 1024 * 1024);
    const { result, call } = read([
      { records: [{ recordID: 'a', values: { payload } }], total: 2, hasMore: true, next: 1 },
      { records: [{ recordID: 'b', values: { payload } }], total: 2, hasMore: false },
    ]);
    await expect(result).rejects.toThrow('16 MiB');
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('applies the same pagination checks to fields', async () => {
    const call = vi.fn().mockResolvedValue({
      fields: [{ fieldID: 'f1', fieldTitle: 'amount', fieldType: 2 }],
      total: 1,
      hasMore: false,
    });
    expect(await readFields({ call }, args, 100)).toHaveLength(1);
  });
});

describe('Tencent Docs explicit configuration and CLI', () => {
  it.each(['clientId', 'openId', 'accessToken'] as const)(
    'requires explicit %s even with environment credentials',
    async (key) => {
      vi.stubEnv('TENCENT_DOCS_CLIENT_ID', 'env-client');
      vi.stubEnv('TENCENT_DOCS_OPEN_ID', 'env-open');
      vi.stubEnv('TENCENT_DOCS_ACCESS_TOKEN', 'env-token');
      const fetch = vi.fn();
      vi.stubGlobal('fetch', fetch);
      const invalid = { ...options, [key]: undefined };
      expect(tencentSmartsheetOptionsSchema.safeParse(invalid).success).toBe(false);
      expect(sourceInputSchema.safeParse({ type: 'tencent-smartsheet', options: invalid }).success).toBe(false);
      await expect(readTencentSmartsheet(invalid as never)).rejects.toThrow(key);
      expect(fetch).not.toHaveBeenCalled();
    }
  );

  it.each([
    { token: 'old-mcp-token' },
    { pageSize: 101 },
    { maxRecords: 0 },
    { maxRetries: 6 },
    { timeoutMs: Infinity },
    { fileId: '' },
    { endpoint: 'https://other-host.invalid' },
  ])('rejects invalid options %j', (change) => {
    expect(tencentSmartsheetOptionsSchema.safeParse({ ...options, ...change }).success).toBe(false);
  });

  it('uses explicit credentials rather than the inherited environment', async () => {
    vi.stubEnv('TENCENT_DOCS_ACCESS_TOKEN', 'env-token');
    const { fetch } = serveTable([field('amount', 2)], [record('r', { amount: 42 })]);
    expect((await readTencentSmartsheet(options)).rows).toEqual([{ _record_id: 'r', amount: 42 }]);
    expect(fetch.mock.calls[0][1].headers['Access-Token']).toBe(credentials.accessToken);
  });

  it('passes a complete CLI config and rejects unsupported engines before session creation', async () => {
    const config = { type: 'tencent-smartsheet', options };
    expect(sourceInputSchema.parse(config)).toEqual(config);
    const directory = await mkdtemp(join(tmpdir(), 'ava-tencent-cli-'));
    try {
      const file = join(directory, 'source.json');
      await writeFile(file, JSON.stringify(config));
      await expect(runSource([`@${file}`], { engine: 'python' })).rejects.toThrow('require the duckdb engine');
      expect(createSession).not.toHaveBeenCalled();
      await runSource([`@${file}`], {});
      expect(createSession).toHaveBeenCalledWith(config, expect.any(Object), undefined);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

describe('Tencent Docs scalar conversion', () => {
  it.each([
    [1, [{ text: ' a' }, { text: '中 ' }], ' a中 ', 'VARCHAR'],
    [2, 0, 0, 'DOUBLE'],
    [3, false, false, 'BOOLEAN'],
    [4, '0', '1970-01-01T00:00:00.000Z', 'TIMESTAMPTZ'],
    [12, '0', '1970-01-01T00:00:00.000Z', 'TIMESTAMPTZ'],
    [13, '-1', '1969-12-31T23:59:59.999Z', 'TIMESTAMPTZ'],
    [14, 0.125, 0.125, 'DOUBLE'],
    [15, '00123', '00123', 'VARCHAR'],
    [16, '', '', 'VARCHAR'],
    [17, [{ text: 'East' }], 'East', 'VARCHAR'],
    [26, -12.34, -12.34, 'DOUBLE'],
    [28, 0.125, 0.125, 'DOUBLE'],
  ])('preserves native scalar type %i and its explicit SQL type', (type: number, value, expected, sqlType) => {
    const fields = [field('v', type)];
    const convert = createRecordConverter(fields);
    expect(columnTypes(fields)).toEqual({ _record_id: 'VARCHAR', v: sqlType });
    expect(convert(record('r', { v: value }))).toEqual({ _record_id: 'r', v: expected });
    expect(convert(record('null', { v: null }))).toEqual({ _record_id: 'null', v: null });
    expect(convert(record('missing'))).toEqual({ _record_id: 'missing', v: null });
  });

  it('handles empty text/selection and omitted system times without overriding explicit values', () => {
    const convert = createRecordConverter([
      field('text', 1),
      field('select', 17),
      field('created', 12),
      field('modified', 13),
      field('date', 4),
    ]);
    const raw = { ...record('r', { text: [], select: [] }), createTime: '0', updateTime: '1' };
    expect(convert(raw)).toEqual({
      _record_id: 'r',
      text: '',
      select: null,
      created: '1970-01-01T00:00:00.000Z',
      modified: '1970-01-01T00:00:00.001Z',
      date: null,
    });
    expect(convert({ ...raw, values: { created: '2', modified: null } })).toMatchObject({
      created: '1970-01-01T00:00:00.002Z',
      modified: null,
    });
  });

  it.each([
    [1, 'text'],
    [2, Infinity],
    [3, 'false'],
    [4, '2026-01-01'],
    [12, '8640000000000001'],
    [13, '9007199254740992'],
    [14, '25%'],
    [15, 123],
    [16, []],
    [17, [{ text: 'a' }, { text: 'b' }]],
    [26, 'CNY 1.00'],
    [28, NaN],
  ])('rejects invalid type %i without disclosing the source value', (type: number, value) => {
    expect(() => createRecordConverter([field('v', type)])(record('r', { v: value }))).toThrow('Invalid value');
  });

  it('reuses a converter without sharing field names between tables and rejects unknown fields/records', () => {
    const amount = createRecordConverter([field('amount', 2)]);
    const phone = createRecordConverter([field('phone', 15)]);
    expect(amount(record('a', { amount: 0 })).amount).toBe(0);
    expect(amount(record('b', { amount: 2 })).amount).toBe(2);
    expect(phone(record('c', { phone: '001' })).phone).toBe('001');
    expect(() => amount(record('d', { phone: '001' }))).toThrow('unknown projected');
    expect(() => amount(null)).toThrow('Invalid record');
  });

  it('skips complex types and rejects malformed, duplicate or reserved metadata', () => {
    expect(supportedFields([field('amount', 2), field('image', 5), field('multi', 9)])).toEqual([field('amount', 2)]);
    for (const fields of [
      [],
      [field('image', 5)],
      [field('_record_id', 1)],
      [field('a', 2), field('A', 2)],
      [field('a', 2), { ...field('b', 2), fieldID: 'a' }],
      [{ ...field('a', 2), fieldTitle: '' }],
    ])
      expect(() => supportedFields(fields)).toThrow();
    const convert = createRecordConverter([field('__proto__', 1)]);
    expect(
      Object.prototype.hasOwnProperty.call(
        convert(record('r', JSON.parse('{"__proto__":[{"text":"safe"}]}'))),
        '__proto__'
      )
    ).toBe(true);
  });
});

describe('Tencent Docs read limits and orchestration', () => {
  it('bounds expanded JSON bytes and cells before retaining an over-budget row', () => {
    const fields = [field('文本', 1)];
    const raw = record('r', { 文本: [{ text: '中文🙂' }] });
    const expected = createRecordConverter(fields)(raw);
    const bytes = Buffer.byteLength(JSON.stringify([expected]));
    const snapshot = createSnapshotBuilder(fields, { maxBytes: bytes, maxCells: 10 });
    snapshot.append(raw);
    expect(snapshot.rows).toEqual([expected]);
    expect(() => snapshot.append(raw)).toThrow('byte read limit');
    expect(snapshot.rows).toHaveLength(1);
    const small = createSnapshotBuilder(fields, { maxBytes: bytes - 1, maxCells: 10 });
    expect(() => small.append(raw)).toThrow('byte read limit');
    expect(small.rows).toEqual([]);
    const dense = createSnapshotBuilder(fields, { maxBytes: 1024, maxCells: 2 });
    dense.append(record('empty'));
    expect(() => dense.append(null)).toThrow('cell read limit');
  });

  it('rejects wide-table expansion from the first record total, before loading partial rows', async () => {
    const { requests } = serveTable(
      Array.from({ length: 1000 }, (_, i) => field(`c${i}`, 2)),
      Array.from({ length: 1000 }, (_, i) => record(`r${i}`))
    );
    await expect(readTencentSmartsheet({ ...options, pageSize: 100, maxRecords: 100000 })).rejects.toThrow('read limit');
    expect(requests.filter((r) => r.getRecords)).toHaveLength(1);
  });

  it('rejects supported metadata changes after record loading', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ ret: 0, data: { getFields: { fields: [field('amount', 2)], total: 1, hasMore: false } } })
      )
      .mockResolvedValueOnce(Response.json({ ret: 0, data: { getRecords: { records: [], total: 0, hasMore: false } } }))
      .mockResolvedValueOnce(
        Response.json({ ret: 0, data: { getFields: { fields: [field('renamed', 2)], total: 1, hasMore: false } } })
      );
    vi.stubGlobal('fetch', fetch);
    await expect(readTencentSmartsheet(options)).rejects.toThrow('metadata changed');
  });

  it('aborts a stalled request, clears its timer and does not expose a partial engine', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
          })
      )
    );
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      const rejected = expect(
        ava.source({ type: 'tencent-smartsheet', options: { ...options, timeoutMs: 50 } })
      ).rejects.toThrow('deadline exceeded');
      await vi.advanceTimersByTimeAsync(50);
      await rejected;
      expect(ava.engine).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      await ava.dispose();
    }
  });
});

describe('Tencent Docs HTTP → loader → DuckDB', () => {
  it('paginates native requests and verifies both business analyses against the sales fixture', async () => {
    const fields = [field('文本', 1), field('数字', 2), field('单选', 17), field('日期', 4)];
    const rows = sales.map((sale, i) =>
      record(`r${i}`, {
        文本: [{ text: sale.文本 }],
        数字: sale.数字,
        单选: [{ text: sale.单选 }],
        日期: String(Date.parse(sale.日期)),
      })
    );
    const { requests } = serveTable(fields, rows);
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await ava.source({ type: 'tencent-smartsheet', options });
      expect((await ava.schema()).models[0].columns.map((c) => c.type)).toEqual([
        'VARCHAR',
        'VARCHAR',
        'DOUBLE',
        'VARCHAR',
        'TIMESTAMP WITH TIME ZONE',
      ]);
      expect(
        (
          await ava.query(
            'SELECT "单选" AS region, count(*) AS orders, sum("数字") AS sales FROM data GROUP BY "单选" ORDER BY sales DESC'
          )
        ).data
      ).toEqual([
        { region: '华西', orders: 4, sales: 550 },
        { region: '华东', orders: 4, sales: 350 },
      ]);
      expect(
        (
          await ava.query(`WITH monthly AS (
        SELECT sum("数字") FILTER (WHERE month("日期" AT TIME ZONE 'UTC') = 1) AS jan_sales,
               sum("数字") FILTER (WHERE month("日期" AT TIME ZONE 'UTC') = 2) AS feb_sales FROM data)
        SELECT *, feb_sales - jan_sales AS change, (feb_sales - jan_sales) / jan_sales * 100 AS change_pct FROM monthly`)
        ).data
      ).toEqual([{ jan_sales: 500, feb_sales: 400, change: -100, change_pct: -20 }]);
      expect(requests.filter((r) => r.getRecords).map((r) => r.getRecords.offset)).toEqual([0, 2, 4, 6]);
      expect(requests.filter((r) => r.getFields).map((r) => r.getFields.offset)).toEqual([0, 2, 0, 2]);
    } finally {
      await ava.dispose();
    }
  });

  it.each([true, false])('preserves an empty table/all-null column schema (empty=%s)', async (empty) => {
    serveTable([field('amount', 2)], empty ? [] : [record('r')]);
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await ava.source({ type: 'tencent-smartsheet', options });
      expect((await ava.schema()).models[0].columns.map((c) => c.type)).toEqual(['VARCHAR', 'DOUBLE']);
      expect((await ava.query('SELECT * FROM data')).data).toEqual(empty ? [] : [{ _record_id: 'r', amount: null }]);
    } finally {
      await ava.dispose();
    }
  });

  it('binds hostile names/values as JSON parameters without creating temporary files', async () => {
    const title = 'quoted"column; DROP TABLE data; --';
    const text = "O'Reilly \\ 中文";
    serveTable([field(title, 1)], [record('r', { [title]: [{ text }] })]);
    const source = await loadTencentSmartsheet(options);
    const run = vi.fn().mockResolvedValue(undefined);
    await source.register({ run } as never);
    expect(run).toHaveBeenCalledExactlyOnceWith(
      'CREATE TABLE data AS SELECT item.* FROM (SELECT unnest(from_json_strict($1::JSON, $2)) AS item)',
      [
        JSON.stringify([{ _record_id: 'r', [title]: text }]),
        JSON.stringify([{ _record_id: 'VARCHAR', [title]: 'VARCHAR' }]),
      ]
    );
    expect(source.allowedPaths).toEqual([]);
    await source.cleanup();
    await source.cleanup();
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await ava.source({ type: 'tencent-smartsheet', options });
      expect((await ava.query('SELECT * FROM data')).data).toEqual([{ _record_id: 'r', [title]: text }]);
    } finally {
      await ava.dispose();
    }
  });

  it('loads all twelve scalar types, including omitted system times and raw currency/percentage', async () => {
    const fields = [
      field('text', 1),
      field('amount', 2),
      field('checked', 3),
      field('date', 4),
      field('created', 12),
      field('modified', 13),
      field('progress', 14),
      field('phone', 15),
      field('email', 16),
      field('select', 17),
      field('currency', 26),
      field('percentage', 28),
    ];
    serveTable(fields, [
      {
        ...record('r', {
          text: [{ text: 'x' }],
          amount: 0,
          checked: false,
          date: '0',
          progress: 0.125,
          phone: '001',
          email: '',
          select: [{ text: 'East' }],
          currency: 1234.56,
          percentage: -0.25,
        }),
        createTime: '0',
        updateTime: '-1',
      },
    ]);
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await ava.source({ type: 'tencent-smartsheet', options });
      expect(
        (
          await ava.query(
            'SELECT * EXCLUDE (date, created, modified), epoch_ms(date) AS date_ms, epoch_ms(created) AS created_ms, epoch_ms(modified) AS modified_ms FROM data'
          )
        ).data
      ).toEqual([
        {
          _record_id: 'r',
          text: 'x',
          amount: 0,
          checked: false,
          progress: 0.125,
          phone: '001',
          email: '',
          select: 'East',
          currency: 1234.56,
          percentage: -0.25,
          date_ms: 0,
          created_ms: 0,
          modified_ms: -1,
        },
      ]);
    } finally {
      await ava.dispose();
    }
  });

  it('rejects a malformed final record without exposing a partial engine', async () => {
    serveTable(
      [field('amount', 2)],
      [record('a', { amount: 1 }), record('b', { amount: 2 }), record('c', { amount: 'bad' })]
    );
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await expect(ava.source({ type: 'tencent-smartsheet', options })).rejects.toThrow('Invalid value');
      expect(ava.engine).toBeNull();
    } finally {
      await ava.dispose();
    }
  });
});
