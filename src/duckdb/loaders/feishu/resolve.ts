import { feishuGet } from './api';
import { parseTableLink } from './url';
import { resolveWikiNode } from './wiki';

import type { FeishuApi } from './api';
import type { BitableRef } from './url';

export interface BitableSourceOptions {
  url?: string;
  appToken?: string;
  tableId?: string;
}

const TABLES_PAGE_SIZE = 100;
const TABLES_TO_LIST = 10;

interface TableSummary {
  tableId: string;
  name: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function listTables(appToken: string, api: FeishuApi): Promise<TableSummary[]> {
  const url = `${api.origin}/open-apis/bitable/v1/apps/${encodeURIComponent(
    appToken
  )}/tables?page_size=${TABLES_PAGE_SIZE}`;
  const data = await feishuGet(url, api.token);
  const items = Array.isArray(data.items) ? data.items : [];
  return items
    .filter(isRecord)
    .map((item) => ({
      tableId: typeof item.table_id === 'string' ? item.table_id : '',
      name: typeof item.name === 'string' ? item.name : '',
    }))
    .filter((table) => table.tableId);
}

/**
 * Use the only table of a Bitable when the link does not name one.
 */
async function onlyTable(appToken: string, api: FeishuApi): Promise<string> {
  const tables = await listTables(appToken, api);
  if (tables.length === 1) {
    return tables[0].tableId;
  }
  if (tables.length === 0) {
    throw new Error(`Feishu Bitable ${appToken} has no tables.`);
  }
  const listed = tables
    .slice(0, TABLES_TO_LIST)
    .map((table) => `${table.name || 'Untitled'} (${table.tableId})`)
    .join(', ');
  const more = tables.length > TABLES_TO_LIST ? ', ...' : '';
  throw new Error(
    `Feishu Bitable ${appToken} has ${tables.length} tables. Add ?table=<tableId> to the URL or "tableId" to the source config. Tables: ${listed}${more}`
  );
}

function pickTableId(
  linkTableId: string | undefined,
  optionTableId: string | undefined,
  url: string
): string | undefined {
  if (linkTableId && optionTableId && linkTableId !== optionTableId) {
    throw new Error(`Feishu Bitable tableId does not match url: ${url}`);
  }
  return linkTableId ?? optionTableId;
}

/**
 * Resolve a Feishu source to the Bitable app token and table ID the API needs.
 *
 * `/base/<appToken>` links already carry the app token, while `/wiki/<nodeToken>`
 * links carry a wiki node token whose hosted object has to be looked up first.
 * Either link may omit `?table=` when the Bitable has exactly one table.
 */
export async function resolveBitableTable(options: BitableSourceOptions, api: FeishuApi): Promise<BitableRef> {
  if (!options.url) {
    const { appToken, tableId } = options;
    if (!appToken || !tableId) {
      throw new Error('Feishu Bitable url or appToken/tableId must be provided');
    }
    return { appToken, tableId };
  }

  const link = parseTableLink(options.url);
  if (!link) {
    throw new Error(`Invalid Feishu Bitable URL: ${options.url}`);
  }
  const tableId = pickTableId(link.tableId, options.tableId, options.url);

  if (link.kind === 'base') {
    if (options.appToken && options.appToken !== link.token) {
      throw new Error(`Feishu Bitable appToken does not match url: ${options.url}`);
    }
    return { appToken: link.token, tableId: tableId ?? (await onlyTable(link.token, api)) };
  }

  const node = await resolveWikiNode(link.token, api);
  if (node.objType !== 'bitable') {
    const label = node.title ? ` (${node.title})` : '';
    throw new Error(
      `Feishu wiki node ${link.token}${label} hosts a ${node.objType}, not a Bitable (多维表格). Only wiki-hosted Bitable nodes can be loaded.`
    );
  }
  if (options.appToken && options.appToken !== node.objToken) {
    throw new Error(`Feishu Bitable appToken does not match the wiki node's table: ${options.url}`);
  }
  return { appToken: node.objToken, tableId: tableId ?? (await onlyTable(node.objToken, api)) };
}
