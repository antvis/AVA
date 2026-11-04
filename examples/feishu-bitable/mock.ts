/**
 * Offline Feishu Bitable stand-in for the examples in this folder.
 *
 * The real loader talks to the Feishu Open API through global `fetch`, so the
 * examples swap `fetch` for this mock and then run the exact same code path:
 * URL -> tenant token -> fields -> paginated records -> cell conversion ->
 * DuckDB `data` view -> SQL.
 *
 * `mock-table.json` is also what `__tests__/duckdb/loaders/feishu-e2e.test.ts`
 * reads, so the examples and the regression test cannot drift apart.
 */

import fixture from './mock-table.json';

export interface MockField {
  field_name: string;
  type: number;
}

export interface MockRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

export interface MockTable {
  pageSize: number;
  appToken: string;
  tableId: string;
  fields: MockField[];
  records: MockRecord[];
}

export const MOCK_TABLE = fixture as unknown as MockTable;

export const MOCK_BITABLE_URL = `https://demo.feishu.cn/base/${MOCK_TABLE.appToken}?table=${MOCK_TABLE.tableId}`;

/** Placeholders: the mock never validates them, the tenant token call is stubbed too. */
export const MOCK_CREDENTIALS = { appId: 'cli_mock_1012', appSecret: 'mock-secret' };

/**
 * Serve the fixture the way the Bitable v1 API would: one token call, one
 * fields page, and records split into `pageSize` pages linked by `page_token`.
 */
export function createFeishuMock(table: MockTable = MOCK_TABLE) {
  return async function feishuMockFetch(input: string | URL | Request): Promise<Response> {
    const url = String(input instanceof Request ? input.url : input);

    if (url.includes('/auth/v3/tenant_access_token/internal')) {
      return Response.json({ code: 0, msg: 'ok', tenant_access_token: 'mock-tenant-token', expire: 7200 });
    }
    if (url.includes('/fields')) {
      return Response.json({ code: 0, msg: 'ok', data: { items: table.fields, has_more: false } });
    }
    if (url.includes('/records')) {
      const pageToken = new URL(url).searchParams.get('page_token');
      const start = pageToken ? Number(pageToken) : 0;
      const items = table.records.slice(start, start + table.pageSize);
      const next = start + items.length;
      const hasMore = next < table.records.length;
      return Response.json({
        code: 0,
        msg: 'ok',
        data: { items, has_more: hasMore, page_token: hasMore ? String(next) : null },
      });
    }
    return Response.json({ code: 0, msg: 'ok', data: {} });
  };
}

/** Replace global fetch with the mock; the returned function restores it. */
export function installFeishuMock(table: MockTable = MOCK_TABLE): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = createFeishuMock(table) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

export interface FeishuTarget {
  mode: 'mock' | 'live';
  url: string;
  appId: string;
  appSecret: string;
}

/**
 * `--mock` forces the fixture. Otherwise a live table is used only when
 * AVA_FEISHU_BITABLE_URL and both credentials are exported.
 */
export function resolveFeishuTarget(
  argv: string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env
): FeishuTarget {
  const url = env.AVA_FEISHU_BITABLE_URL;
  const appId = env.AVA_FEISHU_APP_ID;
  const appSecret = env.AVA_FEISHU_APP_SECRET;

  if (!argv.includes('--mock') && url && appId && appSecret) {
    return { mode: 'live', url, appId, appSecret };
  }
  return { mode: 'mock', url: MOCK_BITABLE_URL, ...MOCK_CREDENTIALS };
}
