/**
 * In-memory Feishu Open API for the Bitable loader tests.
 *
 * Serves a base described in the record search / field list payload format
 * (see __tests__/datasets/feishu/sales.json) through a stubbed global fetch,
 * with page tokens, view filtering and field projection like the real API.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { vi } from 'vitest';

export interface MockField {
  field_id: string;
  field_name: string;
  type: number;
  ui_type?: string;
  is_primary?: boolean;
  property?: unknown;
}

export interface MockRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

export interface MockTable {
  table_id: string;
  name: string;
  fields: MockField[];
  records: MockRecord[];
  /** Record IDs visible in each view. */
  views?: Record<string, string[]>;
}

export interface MockBase {
  app: { app_token: string; name: string; time_zone?: string; [key: string]: unknown };
  tables: MockTable[];
  /** wiki get_node response data, keyed by node token. */
  wiki?: Record<string, unknown>;
}

export interface MockRequest {
  method: string;
  url: URL;
  body?: any;
  authorization?: string;
}

interface MockOptions {
  /** Replace the response of the n-th request (1-based), e.g. with a rate limit error. */
  responses?: Record<number, { status?: number; body: unknown }>;
  /** Rewrite a records page before it is returned. */
  recordsPage?: (page: Record<string, unknown>, table: MockTable) => Record<string, unknown>;
}

export function salesBase(): MockBase {
  return JSON.parse(readFileSync(join(__dirname, '../../datasets/feishu/sales.json'), 'utf8'));
}

const ok = (data: unknown) => ({ code: 0, msg: 'success', data });

function page<T>(items: T[], url: URL): Record<string, unknown> {
  const size = Number(url.searchParams.get('page_size') ?? 20);
  const start = Number(url.searchParams.get('page_token') ?? 0);
  const end = Math.min(start + size, items.length);
  const more = end < items.length;
  return {
    items: items.slice(start, end),
    has_more: more,
    ...(more ? { page_token: String(end) } : {}),
    total: items.length,
  };
}

function route(base: MockBase, options: MockOptions, method: string, url: URL, body: any): unknown {
  const path = url.pathname;
  if (method === 'POST' && path === '/open-apis/auth/v3/tenant_access_token/internal') {
    return { code: 0, msg: 'ok', tenant_access_token: 't-mock-tenant', expire: 7200 };
  }
  if (path === '/open-apis/wiki/v2/spaces/get_node') {
    const node = base.wiki?.[url.searchParams.get('token') ?? ''];
    return node ? ok({ node }) : { code: 131005, msg: 'not found' };
  }
  const match = path.match(
    /^\/open-apis\/bitable\/v1\/apps\/([^/]+)(\/tables(?:\/([^/]+)\/(fields|records\/search))?)?$/
  );
  if (!match || decodeURIComponent(match[1]) !== base.app.app_token) return { code: 1254040, msg: 'BaseTokenNotFound' };
  const [, , tables, tableId, resource] = match;
  if (!tables) return ok({ app: base.app });
  if (!tableId)
    return ok(
      page(
        base.tables.map(({ table_id, name }) => ({ table_id, name, revision: 1 })),
        url
      )
    );
  const table = base.tables.find((item) => item.table_id === decodeURIComponent(tableId));
  if (!table) return { code: 1254041, msg: 'TableIdNotFound' };
  if (resource === 'fields') return ok(page(table.fields, url));
  if (method !== 'POST') return { code: 1254001, msg: 'WrongRequestBody' };

  let records = table.records;
  if (body?.view_id) {
    const visible = table.views?.[body.view_id];
    if (!visible) return { code: 1254042, msg: 'ViewIdNotFound' };
    records = records.filter((record) => visible.includes(record.record_id));
  }
  if (Array.isArray(body?.field_names)) {
    const names: string[] = body.field_names;
    records = records.map((record) => ({
      record_id: record.record_id,
      fields: Object.fromEntries(Object.entries(record.fields).filter(([name]) => names.includes(name))),
    }));
  }
  const result = page(records, url);
  return ok(options.recordsPage ? options.recordsPage(result, table) : result);
}

/** Stub global fetch with the mock API; returns the spy and the recorded requests. */
export function mockFeishu(base: MockBase, options: MockOptions = {}) {
  const requests: MockRequest[] = [];
  const fetch = vi.fn(async (input: string | URL, init: Parameters<typeof fetch>[1] = {}) => {
    const url = new URL(String(input));
    const method = init.method ?? 'GET';
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    const authorization = (init.headers as Record<string, string> | undefined)?.Authorization;
    requests.push({ method, url, body, authorization });
    const replaced = options.responses?.[requests.length];
    if (replaced) return Response.json(replaced.body, { status: replaced.status ?? 200 });
    return Response.json(route(base, options, method, url, body));
  });
  vi.stubGlobal('fetch', fetch);
  return { fetch, requests };
}
