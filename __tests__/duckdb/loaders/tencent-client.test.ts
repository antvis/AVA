import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { decodeToolResult, TencentDocsClient, TencentDocsError } from '../../../src/duckdb/loaders/tencent/client';

const mock = vi.hoisted(() => ({
  connect: vi.fn(),
  callTool: vi.fn(),
  close: vi.fn(),
  transport: undefined as undefined | { fetch: typeof fetch; requestInit: { headers?: unknown } },
}));

vi.mock('@modelcontextprotocol/client', () => ({
  Client: class {
    connect = mock.connect;
    callTool = mock.callTool;
    close = mock.close;
  },
  StreamableHTTPClientTransport: class {
    constructor(_url: URL, options: typeof mock.transport) {
      mock.transport = options;
    }
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Tencent Docs MCP decoding', () => {
  it('prefers structured data and supports JSON text responses', () => {
    expect(
      decodeToolResult({ structuredContent: { total: 0 }, content: [{ type: 'text', text: 'not JSON' }] })
    ).toEqual({ total: 0 });
    expect(decodeToolResult({ content: [{ type: 'text', text: '{"total":0,"error":""}' }] })).toEqual({
      total: 0,
      error: '',
    });
    expect(decodeToolResult({ structuredContent: { code: 0, data: { total: 0 } } })).toEqual({ total: 0 });
  });

  it.each([
    {},
    { content: [{ type: 'text', text: 'private upstream body' }] },
    { structuredContent: [] },
    { structuredContent: { total: 0 }, isError: true },
    {
      content: [
        { type: 'text', text: '{}' },
        { type: 'text', text: '{}' },
      ],
    },
  ])('rejects failed or malformed responses without leaking upstream contents', (result) => {
    expect(() => decodeToolResult(result)).toThrow('Tencent Docs');
    try {
      decodeToolResult(result);
    } catch (error) {
      expect(String(error)).not.toContain('private upstream body');
    }
  });

  it.each([
    [400005, 'Permission denied'],
    [400006, 'Authentication failed'],
    [400007, 'quota exceeded'],
    [400010, 'temporarily unavailable'],
    [400012, 'Authorization expired'],
  ])('retains upstream API code %i, message and diagnostic payload alongside the hint', (code, message) => {
    const payload = { code, message: 'upstream detail', request_id: 'request-123' };
    try {
      decodeToolResult({ structuredContent: payload, isError: true });
      expect.fail('expected an API error');
    } catch (error) {
      expect(error).toBeInstanceOf(TencentDocsError);
      expect(error).toMatchObject({ code, cause: payload });
      expect(String(error)).toContain(message);
      expect(String(error)).toContain(String(code));
      expect(String(error)).toContain('upstream detail');
    }
  });

  it.each([
    { structuredContent: { ret: 499999, msg: 'unrecognized upstream error' } },
    { structuredContent: { error: { code: 499999, message: 'unrecognized upstream error' } } },
    { structuredContent: { code: 0, data: { code: 499999, msg: 'unrecognized upstream error' } } },
    { content: [{ type: 'text', text: '{"code":499999,"msg":"unrecognized upstream error"}' }] },
  ])('retains unknown upstream codes and alternate error envelopes', (result) => {
    expect(() => decodeToolResult(result)).toThrow('unrecognized upstream error');
    expect(() => decodeToolResult(result)).toThrow('499999');
  });

  it.each([
    { structuredContent: { error: 'tool detail' } },
    { isError: true, content: [{ type: 'text', text: 'tool detail' }] },
    { isError: true, structuredContent: { message: 'tool detail' } },
  ])('retains plain-text tool failures', (result) => {
    expect(() => decodeToolResult(result)).toThrow('tool detail');
  });
});

describe('Tencent Docs MCP transport', () => {
  async function setup(maxRetries = 0, signal = new AbortController().signal) {
    const client = new TencentDocsClient(signal, maxRetries);
    await client.connect('test-secret');
    return client;
  }

  it('uses a fixed endpoint with a non-forwardable Authorization header', async () => {
    await setup();
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetch);
    await mock.transport!.fetch('https://docs.qq.com/openapi/mcp', { headers: { Authorization: 'test-secret' } });
    expect(mock.transport!.requestInit.headers).toEqual({ Authorization: 'test-secret' });
    expect(fetch.mock.calls[0][1]).toMatchObject({ redirect: 'error', signal: expect.any(AbortSignal) });
  });

  it.each([
    [401, 'Authentication failed'],
    [403, 'Permission denied'],
    [429, 'quota exceeded'],
    [500, 'status 500'],
  ])('retains HTTP %i context while redacting the configured token', async (status, message) => {
    await setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => new Response('test-secret', { status }))
    );
    await expect(mock.transport!.fetch('https://docs.qq.com/openapi/mcp')).rejects.toThrow(message);
    await expect(mock.transport!.fetch('https://docs.qq.com/openapi/mcp')).rejects.toMatchObject({
      status,
      message: expect.stringContaining('[REDACTED]'),
    });
  });

  it('preserves HTTP upstream codes, request IDs and JSON diagnostics', async () => {
    await setup();
    const body = { code: 499999, msg: 'missing scope', diagnostic: 'test-secret' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Response.json(body, {
          status: 403,
          headers: { 'x-request-id': 'request-123' },
        })
      )
    );
    await expect(mock.transport!.fetch('https://docs.qq.com/openapi/mcp')).rejects.toMatchObject({
      code: 499999,
      status: 403,
      message: expect.stringContaining('missing scope'),
      cause: { requestId: 'request-123', body: { ...body, diagnostic: '[REDACTED]' } },
    });
  });

  it('bounds and cancels HTTP error bodies while retaining gateway diagnostics', async () => {
    await setup();
    const cancel = vi.fn();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('gateway '.repeat(2000)));
      },
      cancel,
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 502 })));
    const error = await mock.transport!.fetch('https://docs.qq.com/openapi/mcp').catch((error) => error);
    expect(error.message).toContain('gateway');
    expect(error.message).toContain('truncated at 8 KiB');
    expect(error.message.length).toBeLessThan(8500);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('honors Retry-After for a bounded transient HTTP retry', async () => {
    await setup(1);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { 'Retry-After': '0' } }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetch);
    expect((await mock.transport!.fetch('https://docs.qq.com/openapi/mcp')).status).toBe(202);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not sleep through an excessive server Retry-After', async () => {
    await setup(2);
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 429, headers: { 'Retry-After': '3600' } }));
    vi.stubGlobal('fetch', fetch);
    await expect(mock.transport!.fetch('https://docs.qq.com/openapi/mcp')).rejects.toThrow('quota exceeded');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('bounds successful response streams before parsing them', async () => {
    await setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array(16 * 1024 * 1024 + 1))));
    const response = await mock.transport!.fetch('https://docs.qq.com/openapi/mcp');
    await expect(response.arrayBuffer()).rejects.toThrow('16 MiB');
  });

  it('sanitizes SDK errors, passes cancellation and closes the SDK client', async () => {
    const controller = new AbortController();
    const client = await setup(0, controller.signal);
    mock.callTool.mockRejectedValue(
      Object.assign(new Error('RPC diagnostic test-secret'), {
        code: -32602,
        data: { request_id: 'req-1', token: 'test-secret' },
        cause: Object.assign(new Error('socket test-secret'), { code: 'ECONNRESET' }),
      })
    );
    await expect(client.call('smartsheet.list_fields', {})).rejects.toMatchObject({
      code: -32602,
      message: 'RPC diagnostic [REDACTED]',
      data: { request_id: 'req-1', token: '[REDACTED]' },
      cause: { code: 'ECONNRESET', message: 'socket [REDACTED]' },
      stack: expect.stringContaining('RPC diagnostic [REDACTED]'),
    });
    expect(mock.callTool.mock.calls[0][1]).toMatchObject({ signal: controller.signal });
    controller.abort();
    await expect(client.call('smartsheet.list_records', {})).rejects.toThrow('deadline exceeded');
    await client.close();
    expect(mock.close).toHaveBeenCalledOnce();
  });

  it('does not retry exhausted daily quota errors', async () => {
    const client = await setup(2);
    mock.callTool.mockResolvedValue({ structuredContent: { code: 400007 }, isError: true });
    await expect(client.call('smartsheet.list_records', {})).rejects.toThrow('quota exceeded');
    expect(mock.callTool).toHaveBeenCalledTimes(1);
  });

  it('rejects an unexpected destination before sending credentials', async () => {
    await setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(mock.transport!.fetch('https://other-host.invalid/openapi/mcp')).rejects.toThrow('unexpected MCP');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retries a documented transient tool error within its configured budget', async () => {
    const client = await setup(1);
    mock.callTool
      .mockResolvedValueOnce({ structuredContent: { code: 400010 }, isError: true })
      .mockResolvedValueOnce({ structuredContent: { total: 0 } });
    expect(await client.call('smartsheet.list_records', {})).toEqual({ total: 0 });
    expect(mock.callTool).toHaveBeenCalledTimes(2);
  });

  it('retains connection failure diagnostics while redacting the configured token', async () => {
    mock.connect.mockRejectedValue(Object.assign(new Error('handshake failed test-secret'), { code: -32600 }));
    const client = new TencentDocsClient(new AbortController().signal, 0);
    await expect(client.connect('test-secret')).rejects.toMatchObject({
      message: 'handshake failed [REDACTED]',
      code: -32600,
    });
  });

  it('retains exhausted network failures and their socket causes', async () => {
    await setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(
        Object.assign(new TypeError('fetch failed'), {
          cause: Object.assign(new Error('connect test-secret'), { code: 'ECONNREFUSED' }),
        })
      )
    );
    await expect(mock.transport!.fetch('https://docs.qq.com/openapi/mcp')).rejects.toMatchObject({
      name: 'TypeError',
      message: 'fetch failed',
      cause: { message: 'connect [REDACTED]', code: 'ECONNREFUSED' },
    });
  });

  it('enforces the read-only tool allowlist at runtime, not just in TypeScript', async () => {
    const client = await setup();
    await expect(client.call('smartsheet.add_records' as never, {})).rejects.toThrow('Only SmartSheet');
    expect(mock.callTool).not.toHaveBeenCalled();
  });
});
