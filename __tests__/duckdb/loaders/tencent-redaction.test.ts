import { afterEach, describe, expect, it, vi } from 'vitest';

import { TencentDocsClient } from '../../../src/duckdb/loaders/tencent/client';

const keys = ['clientId', 'openId', 'accessToken'] as const;
const matrix = [200, 403].flatMap((status) =>
  keys.flatMap((key) =>
    ['raw', 'json'].flatMap((form) =>
      ['single', 'split'].flatMap((chunks) => [1, 24, 47].map((retained) => ({ status, key, form, chunks, retained })))
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
