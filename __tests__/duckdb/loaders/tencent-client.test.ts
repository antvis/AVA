import { afterEach, describe, expect, it, vi } from 'vitest';

import { TencentDocsClient, TencentDocsError } from '../../../src/duckdb/loaders/tencent/client';

const credentials = { clientId: 'fake-client', openId: 'fake-open', accessToken: 'fake-secret' };
const args = { fileId: 'file', sheetId: 'sheet', offset: 0, limit: 2 };
const success = () =>
  Response.json({ ret: 0, msg: 'Succeed', data: { getFields: { total: 0, fields: [], hasMore: false } } });
async function setup(maxRetries = 0, signal = new AbortController().signal) {
  const client = new TencentDocsClient(signal, maxRetries);
  await client.connect(credentials);
  return client;
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Tencent Docs native OpenAPI transport', () => {
  it('sends only the documented headers and operation, with encoded IDs and no redirect forwarding', async () => {
    const fetch = vi.fn().mockImplementation(success);
    vi.stubGlobal('fetch', fetch);
    const client = await setup();
    expect(await client.call('getFields', { ...args, fileId: 'a/b?#' })).toEqual({
      fields: [],
      total: 0,
      hasMore: false,
    });
    expect(fetch.mock.calls[0][0]).toBe('https://docs.qq.com/openapi/smartbook/v2/files/a%2Fb%3F%23/sheets/sheet');
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      redirect: 'error',
      signal: expect.any(AbortSignal),
      headers: {
        'Access-Token': 'fake-secret',
        'Client-Id': 'fake-client',
        'Open-Id': 'fake-open',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ getFields: { offset: 0, limit: 2 } });
  });

  it.each([401, 403, 429, 500, 502, 503, 504])(
    'retains HTTP %i diagnostics, request IDs and redacts all configured credentials',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockImplementation(() =>
            Response.json(
              { ret: 98765, msg: Object.values(credentials).join(' ') },
              { status, headers: { 'x-request-id': 'req-123' } }
            )
          )
      );
      await expect((await setup()).call('getFields', args)).rejects.toMatchObject({
        code: 98765,
        status,
        cause: { requestId: 'req-123' },
        message: expect.stringContaining('req-123'),
      });
      const error = await (await setup()).call('getFields', args).catch((e) => e);
      const diagnostic = JSON.stringify(error) + error.stack;
      for (const secret of Object.values(credentials)) expect(diagnostic).not.toContain(secret);
      expect(diagnostic).toContain('[REDACTED]');
    }
  );

  it.each([401, 403])('does not retry HTTP %i even when retries are configured', async (status) => {
    const fetch = vi
      .fn()
      .mockImplementation(() => Response.json({ ret: 12345, msg: 'authorization rejected' }, { status }));
    vi.stubGlobal('fetch', fetch);
    await expect((await setup(2)).call('getFields', args)).rejects.toMatchObject({ status, code: 12345 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('bounds UTF-8 business diagnostics and retains HTTP-200 request IDs', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation(() =>
          Response.json({ ret: 12345, msg: '拒绝'.repeat(8192) }, { headers: { 'x-request-id': 'request-200' } })
        )
    );
    const error = await (await setup()).call('getFields', args).catch((error) => error);
    expect(error).toMatchObject({ code: 12345, status: 200, cause: { requestId: 'request-200' } });
    expect(error.message).toContain('truncated at 8 KiB');
    expect(Buffer.byteLength(error.cause.body, 'utf8')).toBeLessThan(8300);
  });

  it('treats HTTP 200 with nonzero ret as a failure without retrying unknown business codes', async () => {
    const fetch = vi.fn().mockImplementation(() => Response.json({ ret: 10313, msg: 'AccessToken Is Empty' }));
    vi.stubGlobal('fetch', fetch);
    await expect((await setup(2)).call('getFields', args)).rejects.toMatchObject({
      code: 10313,
      status: 200,
      message: expect.stringContaining('AccessToken Is Empty'),
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    {},
    { ret: 0 },
    { ret: '0', data: { getFields: {} } },
    { ret: 0, data: { getRecords: {} } },
    { ret: 0, data: { getFields: [] } },
  ])('rejects malformed success envelopes', async (body) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Response.json(body))
    );
    await expect((await setup()).call('getFields', args)).rejects.toThrow('Invalid OpenAPI');
  });

  it('retains bounded non-JSON diagnostics and cancels the body', async () => {
    const cancel = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(new TextEncoder().encode('gateway '.repeat(2000)));
            },
            cancel,
          }),
          { status: 502 }
        )
      )
    );
    const error = await (await setup()).call('getFields', args).catch((e) => e);
    expect(error).toBeInstanceOf(TencentDocsError);
    expect(error.message).toContain('truncated at 8 KiB');
    expect(error.message.length).toBeLessThan(8500);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('bounds successful response streams before JSON parsing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array(16 * 1024 * 1024 + 1))));
    await expect((await setup()).call('getFields', args)).rejects.toThrow('16 MiB');
  });

  it.each(['3600', 'invalid'])('does not wait through excessive or invalid Retry-After %s', async (retryAfter) => {
    const fetch = vi
      .fn()
      .mockImplementation(() => new Response(null, { status: 429, headers: { 'Retry-After': retryAfter } }));
    vi.stubGlobal('fetch', fetch);
    await expect((await setup(2)).call('getFields', args)).rejects.toMatchObject({ status: 429 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries transient HTTP failures within budget and honors Retry-After', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { 'Retry-After': '0' } }))
      .mockImplementation(success);
    vi.stubGlobal('fetch', fetch);
    expect(await (await setup(1)).call('getFields', args)).toMatchObject({ total: 0 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('bounds network retries and preserves redacted nested error causes', async () => {
    const fetch = vi.fn().mockRejectedValue(
      Object.assign(new TypeError('fetch fake-secret'), {
        cause: Object.assign(new Error('socket fake-open'), { code: 'ECONNRESET' }),
      })
    );
    vi.stubGlobal('fetch', fetch);
    await expect((await setup(1)).call('getFields', args)).rejects.toMatchObject({
      name: 'TypeError',
      message: 'fetch [REDACTED]',
      cause: { code: 'ECONNRESET', message: 'socket [REDACTED]' },
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('aborts stalled successful/error bodies and retry waits with the whole-load deadline', async () => {
    for (const status of [200, 403, 429]) {
      const controller = new AbortController();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => new Response(status === 429 ? null : new ReadableStream(), { status }))
      );
      const client = await setup(2, controller.signal);
      const result = client.call('getFields', args);
      setTimeout(() => controller.abort(), 10);
      await expect(result).rejects.toThrow('deadline exceeded');
    }
  });

  it.each(['clientId', 'openId', 'accessToken'])(
    'validates %s without printing credentials or sending requests',
    async (key) => {
      const fetch = vi.fn();
      vi.stubGlobal('fetch', fetch);
      for (const value of ['', 'line\nbreak', 'non-ascii中']) {
        const client = new TencentDocsClient(new AbortController().signal, 0);
        await expect(client.connect({ ...credentials, [key]: value })).rejects.toThrow(`valid ${key}`);
      }
      expect(fetch).not.toHaveBeenCalled();
    }
  );

  it('enforces a runtime read allowlist, connection lifecycle and explicit IDs', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const client = await setup();
    await expect(client.call('addRecords' as never, args)).rejects.toThrow('Only SmartSheet');
    await expect(client.call('getRecords', {})).rejects.toThrow('Explicit native');
    await client.close();
    await expect(client.call('getRecords', args)).rejects.toThrow('not configured');
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('diagnostic credential boundary regressions', () => {
  const keys = ['clientId', 'openId', 'accessToken'] as const;
  const matrix = [200, 403].flatMap((status) =>
    keys.flatMap((key) =>
      ['raw', 'json'].flatMap((form) =>
        ['single', 'split'].flatMap((chunks) =>
          [1, 24, 47].map((retained) => ({ status, key, form, chunks, retained }))
        )
      )
    )
  );
  const encoder = new TextEncoder();
  afterEach(() => vi.unstubAllGlobals());

  describe('Tencent Docs credential redaction at diagnostic boundaries', () => {
    it.each(matrix)(
      'protects $key ($form, $chunks, HTTP $status, $retained retained bytes)',
      async ({ status, key, form, chunks, retained }) => {
        const secret =
          form === 'json'
            ? `unique-${key}-"\\-sensitive-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ-opaque-end`
            : `unique-${key}-sensitive-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ-opaque-end`;
        const rendered = form === 'json' ? JSON.stringify(secret).slice(1, -1) : secret;
        const credentials = { clientId: 'test-client', openId: 'test-open', accessToken: 'test-access', [key]: secret };
        const start = '{"ret":12345,"msg":"';
        const anchor = '!boundary-anchor!';
        const unicode = '中🙂'.repeat(1000);
        const filler = unicode + 'x'.repeat(8192 - retained - Buffer.byteLength(start + unicode + anchor)) + anchor;
        const body = encoder.encode(start + filler + rendered + 'x'.repeat(1000) + '"}');
        const cuts =
          chunks === 'single' ? [0, body.length] : [0, start.length + 1, 8192 - 13, 8192 - 1, 8192 + 1, body.length];
        const cancel = vi.fn();
        vi.stubGlobal(
          'fetch',
          vi.fn().mockImplementation(
            () =>
              new Response(
                new ReadableStream({
                  start(controller) {
                    for (let i = 1; i < cuts.length; i++) controller.enqueue(body.subarray(cuts[i - 1], cuts[i]));
                    controller.close();
                  },
                  cancel,
                }),
                { status }
              )
          )
        );
        const client = new TencentDocsClient(new AbortController().signal, 0);
        await client.connect(credentials);
        try {
          const error = await client.call('getFields', { fileId: 'file', sheetId: 'sheet' }).catch((error) => error);
          expect(error).toMatchObject({ status });
          const diagnostic = error.cause.body as string;
          expect(diagnostic).toContain(anchor);
          expect(diagnostic.split(anchor)[1]).not.toMatch(
            new RegExp(`^${rendered.slice(0, retained).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
          );
          for (const value of [error.message, JSON.stringify(error.cause), error.stack]) {
            expect(value).not.toContain(secret);
            expect(value).not.toContain(rendered);
            if (retained >= 24) expect(value).not.toContain(rendered.slice(0, retained));
          }
          expect(diagnostic).toContain('truncated at 8 KiB');
          expect(Buffer.byteLength(diagnostic)).toBeLessThan(8300);
          expect(diagnostic).not.toContain('\uFFFD');
        } finally {
          await client.close();
        }
      }
    );

    it.each([200, 403])('does not emit a broken UTF-8 character at the output boundary (HTTP %i)', async (status) => {
      const secret = 'opaque-utf8-secret-0123456789ABCDEFGHIJKLMN';
      const start = '{"ret":12345,"msg":"';
      const safeStart = start + (status === 200 ? '[REDACTED]' : secret);
      const body = start + secret + 'x'.repeat(8191 - Buffer.byteLength(safeStart)) + '🙂' + 'x'.repeat(1000) + '"}';
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status })));
      const client = new TencentDocsClient(new AbortController().signal, 0);
      await client.connect({ clientId: 'test-client', openId: 'test-open', accessToken: secret });
      try {
        const error = await client.call('getFields', { fileId: 'file', sheetId: 'sheet' }).catch((error) => error);
        expect(error.cause.body).not.toContain('\uFFFD');
        expect(error.cause.body).toContain('truncated at 8 KiB');
        for (const value of [error.message, JSON.stringify(error.cause), error.stack])
          expect(value).not.toContain(secret);
      } finally {
        await client.close();
      }
    });

    it('removes overlapping credential prefixes exposed by conservative boundary omission', async () => {
      const first = 'left-private-0123456789-shared-fragment';
      const second = 'shared-fragment-right-private-ABCDEFGHIJK';
      const tail = first + '-right-p';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response('x'.repeat(8192 - tail.length) + tail + 'unread-tail', { status: 403 }))
      );
      const client = new TencentDocsClient(new AbortController().signal, 0);
      await client.connect({ clientId: first, openId: second, accessToken: 'test-access' });
      try {
        const error = await client.call('getFields', { fileId: 'file', sheetId: 'sheet' }).catch((error) => error);
        for (const value of [error.message, JSON.stringify(error.cause), error.stack]) {
          expect(value).not.toContain('left-private-0123456789-');
          expect(value).not.toContain('shared-fragment-right-p');
        }
      } finally {
        await client.close();
      }
    });

    it.each([200, 403])('protects credentials longer than the diagnostic budget (HTTP %i)', async (status) => {
      const secret = 'long-private-credential-' + 'Z'.repeat(16000);
      const start = '{"ret":12345,"msg":"';
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(start + secret + '"}', { status })));
      const client = new TencentDocsClient(new AbortController().signal, 0);
      await client.connect({ clientId: 'test-client', openId: 'test-open', accessToken: secret });
      try {
        const error = await client.call('getFields', { fileId: 'file', sheetId: 'sheet' }).catch((error) => error);
        for (const value of [error.message, JSON.stringify(error.cause), error.stack])
          expect(value).not.toContain(secret.slice(0, 24));
        expect(Buffer.byteLength(JSON.stringify(error.cause))).toBeLessThan(8400);
      } finally {
        await client.close();
      }
    });

    it('cancels at the HTTP byte budget without waiting for the rest of a credential or a stalled body', async () => {
      const secret = 'opaque-private-prefix-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const retained = 24;
      const cancel = vi.fn();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(encoder.encode('x'.repeat(8192 - retained) + secret.slice(0, retained)));
              },
              cancel,
            }),
            { status: 403 }
          )
        )
      );
      const client = new TencentDocsClient(new AbortController().signal, 0);
      await client.connect({ clientId: 'test-client', openId: 'test-open', accessToken: secret });
      try {
        const error = await client.call('getFields', { fileId: 'file', sheetId: 'sheet' }).catch((error) => error);
        expect(error).toMatchObject({ status: 403 });
        for (const value of [error.message, JSON.stringify(error.cause), error.stack])
          expect(value).not.toContain(secret.slice(0, retained));
        expect(cancel).toHaveBeenCalledOnce();
      } finally {
        await client.close();
      }
    });
  });
});
