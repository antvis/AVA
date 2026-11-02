import { feishuError, feishuOrigin, getTenantAccessToken } from './token';
import { convertRecord, isSupportedFieldType } from './convert';
import { resolveBitableTable } from './resolve';

import type { FeishuCell, FeishuField } from './convert';
import type { FeishuBitableSourceOptions } from '../../../types';

function tableUrl(origin: string, table: { appToken: string; tableId: string }, suffix: string): string {
  return `${origin}/open-apis/bitable/v1/apps/${encodeURIComponent(table.appToken)}/tables/${encodeURIComponent(
    table.tableId
  )}${suffix}`;
}

const RECORDS_PAGE_SIZE = 500;
const FIELDS_PAGE_SIZE = 100;

async function readFeishuBody(
  response: Response
): Promise<{ data?: { items?: any[]; has_more?: unknown; page_token?: unknown } }> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw feishuError(undefined, 'response is not JSON');
  }
  if (!body || typeof body !== 'object') {
    throw feishuError(undefined, 'response is not JSON');
  }
  const payload = body as {
    code?: unknown;
    msg?: unknown;
    data?: { items?: any[]; has_more?: unknown; page_token?: unknown };
  };
  if (payload.code !== 0) {
    throw feishuError(payload.code, payload.msg);
  }
  return payload;
}

async function getAllItems(token: string, url: string, pageSize: number): Promise<any[]> {
  const items: any[] = [];
  const seen = new Set<string>();
  let pageToken = '';
  do {
    const query = `page_size=${pageSize}${pageToken ? `&page_token=${encodeURIComponent(pageToken)}` : ''}`;
    const response = await fetch(`${url}?${query}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await readFeishuBody(response);
    items.push(...(body.data?.items ?? []));
    const hasMore = body.data?.has_more === true;
    pageToken = hasMore && typeof body.data?.page_token === 'string' ? body.data?.page_token : '';
    if (hasMore && !pageToken) throw new Error('Feishu pagination returned has_more without page_token');
    if (pageToken) {
      if (seen.has(pageToken)) throw new Error('Feishu pagination returned a repeated page_token');
      seen.add(pageToken);
    }
  } while (pageToken);
  return items;
}

export async function readFeishuTable(
  options: FeishuBitableSourceOptions
): Promise<{ fields: FeishuField[]; rows: Record<string, FeishuCell>[] }> {
  const origin = feishuOrigin(options.url);
  const token = await getTenantAccessToken(options.appId, options.appSecret, origin);
  // Wiki links carry a node token, so resolve the table after the token exists.
  const table = await resolveBitableTable(options, { token, origin });
  const fieldsItems = await getAllItems(token, tableUrl(origin, table, '/fields'), FIELDS_PAGE_SIZE);
  const fields: FeishuField[] = fieldsItems
    .filter((field) => isSupportedFieldType(field.type))
    .map((field) => ({ name: field.field_name, type: field.type }));
  const records = await getAllItems(token, tableUrl(origin, table, '/records'), RECORDS_PAGE_SIZE);
  const rows = records.map((record) => convertRecord(fields, record.fields ?? {}));
  return { fields, rows };
}

export async function readTable(options: FeishuBitableSourceOptions): Promise<Record<string, FeishuCell>[]> {
  return (await readFeishuTable(options)).rows;
}
