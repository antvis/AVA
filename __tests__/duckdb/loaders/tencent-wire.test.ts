import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';

const credentials = { clientId: 'fake-client', openId: 'fake-open', accessToken: 'fake-token' };
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Tencent Docs native HTTP wire → DuckDB (offline)', () => {
  it('does not reinterpret an MCP token as OpenAPI authorization', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    vi.stubEnv('TENCENT_DOCS_TOKEN', 'old-mcp-token');
    for (const key of ['CLIENT_ID', 'OPEN_ID', 'ACCESS_TOKEN']) vi.stubEnv(`TENCENT_DOCS_${key}`, undefined);
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await expect(
        ava.source({ type: 'tencent-smartsheet', options: { fileId: 'file', sheetId: 'sheet' } })
      ).rejects.toThrow('valid clientId');
      expect(fetch).not.toHaveBeenCalled();
      expect(ava.engine).toBeNull();
    } finally {
      await ava.dispose();
      vi.unstubAllEnvs();
    }
  });

  it('aborts a stalled request within the whole-load deadline without a partial engine', async () => {
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
          type: 'tencent-smartsheet',
          options: { fileId: 'file', sheetId: 'sheet', ...credentials, timeoutMs: 50 },
        })
      ).rejects.toThrow('deadline exceeded');
      expect(ava.engine).toBeNull();
    } finally {
      await ava.dispose();
    }
  });

  it('paginates native request bodies, projects verified fields, rechecks metadata and loads typed DuckDB', async () => {
    const requests: Record<string, any>[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        expect(url).toBe('https://docs.qq.com/openapi/smartbook/v2/files/file/sheets/sheet');
        expect(init.redirect).toBe('error');
        expect(init.headers['Access-Token']).toBe('fake-token');
        const request = JSON.parse(String(init.body));
        requests.push(request);
        const operation = Object.keys(request)[0];
        const args = request[operation];
        expect(['getFields', 'getRecords']).toContain(operation);
        const fields = [
          { fieldID: 'f', fieldTitle: 'amount', fieldType: 2 },
          { fieldID: 's', fieldTitle: 'region', fieldType: 17 },
        ];
        const page =
          operation === 'getFields'
            ? {
                fields: fields.slice(args.offset, args.offset + args.limit),
                total: 2,
                hasMore: args.offset === 0,
                next: 1,
              }
            : {
                records: [
                  { recordID: `r${args.offset}`, values: { amount: args.offset + 1, region: [{ text: 'East' }] } },
                ],
                total: 2,
                hasMore: args.offset === 0,
                next: 1,
              };
        if (operation === 'getRecords') expect(args.fieldTitles).toEqual(['amount', 'region']);
        return Response.json({ ret: 0, msg: 'Succeed', data: { [operation]: page } });
      })
    );
    const ava = new AVA({ llm: { model: 'offline' } });
    try {
      await ava.source({
        type: 'tencent-smartsheet',
        options: { fileId: 'file', sheetId: 'sheet', ...credentials, pageSize: 1 },
      });
      expect((await ava.query('SELECT sum(amount) AS total, min(region) AS region FROM data')).data).toEqual([
        { total: 3, region: 'East' },
      ]);
      expect(requests.filter((r) => r.getRecords).map((r) => r.getRecords.offset)).toEqual([0, 1]);
      expect(requests.filter((r) => r.getFields).map((r) => r.getFields.offset)).toEqual([0, 1, 0, 1]);
    } finally {
      await ava.dispose();
    }
  });
});
