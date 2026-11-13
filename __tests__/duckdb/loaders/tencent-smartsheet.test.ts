import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { run as runSource } from '../../../src/cli/commands/source';
import { createSession } from '../../../src/cli/session/client';
import { sourceInputSchema } from '../../../src/contracts';
import { TencentSmartsheetClient } from '../../../src/duckdb/loaders/tencent-smartsheet/client';
import { createRecordConverter, supportedFields } from '../../../src/duckdb/loaders/tencent-smartsheet/convert';
import { readRecords, readTencentSmartsheet } from '../../../src/duckdb/loaders/tencent-smartsheet/read';
import { createSnapshotBuilder } from '../../../src/duckdb/loaders/tencent-smartsheet/snapshot';

import type { TencentSmartsheetField } from '../../../src/duckdb/loaders/tencent-smartsheet/convert';

// Mock only HTTP and CLI session creation, never the reader/converter/loader under test.
vi.mock('../../../src/cli/session/client', () => ({ createSession: vi.fn() }));
const credentials = { clientId: 'fake-client', openId: 'fake-open', accessToken: 'fake-secret' };
const options = { fileId: 'file', sheetId: 'sheet', ...credentials, pageSize: 2 };
const field = (fieldTitle: string, fieldType: number): TencentSmartsheetField => ({
  fieldID: fieldTitle,
  fieldTitle,
  fieldType,
});
const record = (recordID: string, values: Record<string, unknown> = {}) => ({ recordID, values });

afterEach(() => {
  vi.unstubAllGlobals();
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
  return requests;
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

  it.each([401, 200])('preserves OpenAPI errors without retrying or exposing credentials (HTTP %i)', async (status) => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { ret: 123, msg: 'Denied fake-client fake-open fake-secret', data: { credentials } },
          { status, headers: { 'x-request-id': 'request-123' } }
        )
      );
    vi.stubGlobal('fetch', fetch);
    await expect(client(2).call('getFields', args)).rejects.toMatchObject({
      code: 123,
      status,
      cause: { ret: 123, msg: 'Denied [REDACTED] [REDACTED] [REDACTED]', requestId: 'request-123' },
    });
    expect(fetch).toHaveBeenCalledOnce();
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

  it.each([
    {
      name: 'an incomplete final page',
      pages: [{ records: [row('a')], total: 2, hasMore: false }],
      error: 'Incomplete snapshot',
    },
    {
      name: 'a page that does not advance',
      pages: [{ records: [row('a')], total: 2, hasMore: true, next: 0 }],
      error: 'Pagination did not advance',
    },
    {
      name: 'a record repeated across pages',
      pages: [
        { records: [row('a')], total: 2, hasMore: true, next: 1 },
        { records: [row('a')], total: 2, hasMore: false },
      ],
      error: 'repeated item ID',
    },
  ])('rejects $name', async ({ pages, error }) => {
    await expect(read(pages).result).rejects.toThrow(error);
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
});

describe('Tencent Docs explicit configuration and CLI', () => {
  it.each(['clientId', 'openId', 'accessToken'] as const)('requires an explicit %s', async (key) => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(readTencentSmartsheet({ ...options, [key]: undefined } as never)).rejects.toThrow(key);
    expect(fetch).not.toHaveBeenCalled();
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

  it('rejects column names that collide in DuckDB', () => {
    expect(() => supportedFields([field('_record_id', 1)])).toThrow('reserved column name');
    expect(() => supportedFields([field('amount', 2), field('AMOUNT', 2)])).toThrow('Duplicate');
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
    const requests = serveTable(
      Array.from({ length: 1000 }, (_, i) => field(`c${i}`, 2)),
      Array.from({ length: 1000 }, (_, i) => record(`r${i}`))
    );
    await expect(readTencentSmartsheet({ ...options, pageSize: 100, maxRecords: 100000 })).rejects.toThrow(
      'read limit'
    );
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

  it('loads quoted field names and values through DuckDB', async () => {
    const title = 'quoted"column';
    const text = "O'Reilly \\ 中文";
    serveTable([field(title, 1)], [record('r', { [title]: [{ text }] })]);
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await ava.source({ type: 'tencent-smartsheet', options });
      expect((await ava.query('SELECT * FROM data')).data).toEqual([{ _record_id: 'r', [title]: text }]);
    } finally {
      await ava.dispose();
    }
  });

  it('paginates fields and records and loads all twelve supported types into DuckDB', async () => {
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
    const requests = serveTable(
      [...fields, field('image', 5)],
      [
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
        record('s', { amount: 1 }),
        record('t', { amount: 2 }),
      ]
    );
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await ava.source({ type: 'tencent-smartsheet', options });
      const pages = requests.flatMap(({ getRecords }) => (getRecords ? [getRecords] : []));
      expect(pages.map((page) => page.offset)).toEqual([0, 2]);
      expect(pages[0].fieldTitles).toEqual(fields.map((item) => item.fieldTitle));
      expect(requests.some(({ getFields }) => getFields?.offset === 2)).toBe(true);
      expect((await ava.query('SELECT _record_id FROM data ORDER BY _record_id')).data).toEqual([
        { _record_id: 'r' },
        { _record_id: 's' },
        { _record_id: 't' },
      ]);
      expect(
        (
          await ava.query(
            "SELECT * EXCLUDE (date, created, modified), epoch_ms(date) AS date_ms, epoch_ms(created) AS created_ms, epoch_ms(modified) AS modified_ms FROM data WHERE _record_id = 'r'"
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
