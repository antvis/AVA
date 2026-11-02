import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Tencent Docs actual MCP SDK wire integration (offline)', () => {
  it('aborts a stalled handshake within the whole-load deadline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            if (init.signal.aborted) reject(new Error('aborted'));
            else init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
          })
      )
    );
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await expect(
        ava.source({
          type: 'tencent-docs-smartsheet',
          options: {
            fileId: 'file',
            sheetId: 'sheet',
            token: 'fake-token',
            timeoutMs: 50,
          },
        })
      ).rejects.toThrow('deadline exceeded');
      expect(ava.engine).toBeNull();
    } finally {
      await ava.dispose();
    }
  });

  it('completes the MCP handshake, paginates JSON-RPC tools and loads real DuckDB', async () => {
    const requests: { method?: string; params?: Record<string, any> }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input, init) => {
        if (!init?.body) return new Response(null, { status: 405 });
        const request = JSON.parse(String(init.body));
        requests.push(request);
        if (request.id === undefined) return new Response(null, { status: 202 });
        let result;
        if (request.method === 'initialize') {
          result = {
            protocolVersion: '2025-03-26',
            capabilities: { tools: {} },
            serverInfo: { name: 'mock-tencent', version: '1' },
          };
        } else if (request.method === 'tools/call') {
          const { name, arguments: args } = request.params;
          const data =
            name === 'smartsheet.list_fields'
              ? {
                  fields: [{ field_id: 'f', field_title: 'amount', field_type: 'number' }],
                  total: 1,
                  has_more: false,
                  next: 0,
                }
              : {
                  records: [
                    {
                      record_id: `r${args.offset}`,
                      field_values: [{ field: 'amount', number_value: args.offset + 1 }],
                    },
                  ],
                  total: 2,
                  has_more: args.offset === 0,
                  next: args.offset === 0 ? 1 : 0,
                  error: '',
                };
          result = { structuredContent: data, content: [{ type: 'text', text: JSON.stringify(data) }] };
        } else {
          return Response.json({ jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Unknown method' } });
        }
        return Response.json({ jsonrpc: '2.0', id: request.id, result });
      })
    );
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await ava.source({
        type: 'tencent-docs-smartsheet',
        options: { fileId: 'file', sheetId: 'sheet', token: 'fake-token', pageSize: 1 },
      });
      expect((await ava.query('SELECT sum(amount) AS total FROM data')).data).toEqual([{ total: 3 }]);
      expect(requests.some((request) => request.method === 'initialize')).toBe(true);
      expect(
        requests
          .filter((r) => r.method === 'tools/call' && r.params?.name === 'smartsheet.list_records')
          .map((r) => r.params!.arguments.offset)
      ).toEqual([0, 1]);
    } finally {
      await ava.dispose();
    }
  });
});
