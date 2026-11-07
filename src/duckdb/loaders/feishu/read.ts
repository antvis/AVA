import { feishuPages, feishuRequest } from './api';
import { checkTimeZone, isLinkFieldType, isSupportedFieldType, linkedTableId } from './convert';
import { resolveBitable } from './resolve';
import { feishuApi } from './token';

import type { FeishuApi } from './api';
import type { FeishuField } from './convert';
import type { FeishuBitableSourceOptions } from '../../../types';

export interface FeishuRecord {
  id: string;
  fields: Record<string, unknown>;
}

export interface FeishuTable {
  id: string;
  name: string;
  fields: FeishuField[];
  records: FeishuRecord[];
}

export interface FeishuBase {
  appToken: string;
  name: string;
  /** IANA time zone of the base, used to read dates. */
  timeZone: string;
  /** True when the source names one table; it is exposed as the `data` view. */
  single: boolean;
  /** Tables to expose, in base order. */
  tables: FeishuTable[];
  /** Tables outside the selection that link fields point at, read with their primary field only. */
  linkedTables: FeishuTable[];
}

const TABLES_PAGE_SIZE = 100;
const FIELDS_PAGE_SIZE = 100;
const RECORDS_PAGE_SIZE = 500;
const DEFAULT_TIME_ZONE = 'UTC';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function appPath(appToken: string, suffix = ''): string {
  return `/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}${suffix}`;
}

function tablePath(appToken: string, tableId: string, suffix: string): string {
  return appPath(appToken, `/tables/${encodeURIComponent(tableId)}${suffix}`);
}

async function readTables(api: FeishuApi, appToken: string): Promise<{ id: string; name: string }[]> {
  const { items } = await feishuPages(api, appPath(appToken, '/tables'), { pageSize: TABLES_PAGE_SIZE });
  return items
    .map((item) => ({
      id: typeof item.table_id === 'string' ? item.table_id : '',
      name: typeof item.name === 'string' ? item.name : '',
    }))
    .filter((table) => table.id);
}

async function readFields(api: FeishuApi, appToken: string, tableId: string): Promise<FeishuField[]> {
  const { items } = await feishuPages(api, tablePath(appToken, tableId, '/fields'), { pageSize: FIELDS_PAGE_SIZE });
  return items
    .filter((item) => typeof item.field_name === 'string' && typeof item.type === 'number')
    .map((item) => ({
      id: typeof item.field_id === 'string' ? item.field_id : undefined,
      name: item.field_name as string,
      type: item.type as number,
      uiType: typeof item.ui_type === 'string' ? item.ui_type : undefined,
      primary: item.is_primary === true,
      property: isRecord(item.property) ? item.property : undefined,
    }));
}

/**
 * Read every record of a table through the record search API, 500 per page.
 * The result must contain `total` distinct records; a mismatch means the table
 * changed during the read, so the load fails instead of returning partial data.
 */
export async function readRecords(
  api: FeishuApi,
  appToken: string,
  table: { id: string; name: string },
  body: { view_id?: string; field_names?: string[] } = {}
): Promise<FeishuRecord[]> {
  const { items, total } = await feishuPages(api, tablePath(appToken, table.id, '/records/search'), {
    method: 'POST',
    pageSize: RECORDS_PAGE_SIZE,
    body,
  });
  const label = table.name || table.id;
  const seen = new Set<string>();
  const records: FeishuRecord[] = [];
  for (const item of items) {
    const id = typeof item.record_id === 'string' ? item.record_id : '';
    if (!id) throw new Error(`Feishu Bitable table ${label} returned a record without record_id`);
    if (seen.has(id)) {
      throw new Error(`Feishu Bitable table ${label} returned record ${id} twice; the table changed while loading`);
    }
    seen.add(id);
    records.push({ id, fields: isRecord(item.fields) ? item.fields : {} });
  }
  if (total !== undefined && total !== records.length) {
    throw new Error(
      `Feishu Bitable table ${label} reported ${total} records but returned ${records.length}; the table changed while loading`
    );
  }
  return records;
}

/**
 * Read a Bitable: the named table, or every table of the base when none is named.
 * Link fields display the primary field of the linked records, so linked tables
 * outside the selection are read with that field only.
 */
export async function readFeishuBase(options: FeishuBitableSourceOptions): Promise<FeishuBase> {
  const api = await feishuApi(options);
  const target = await resolveBitable(options, api);
  if (options.viewId && !target.tableId) {
    throw new Error('Feishu Bitable viewId needs a table: add ?table= to the url or set tableId');
  }

  const app = await feishuRequest(api, appPath(target.appToken));
  const meta = isRecord(app.app) ? app.app : {};
  const reported = typeof meta.time_zone === 'string' && meta.time_zone ? meta.time_zone : DEFAULT_TIME_ZONE;
  const timeZone = checkTimeZone(options.timeZone ?? reported);

  const tables = await readTables(api, target.appToken);
  const selected = target.tableId
    ? [tables.find((table) => table.id === target.tableId) ?? { id: target.tableId, name: target.tableId }]
    : tables;
  if (selected.length === 0) {
    throw new Error('Feishu Bitable has no tables.');
  }

  const loaded: FeishuTable[] = [];
  for (const table of selected) {
    const fields = await readFields(api, target.appToken, table.id);
    const records = await readRecords(api, target.appToken, table, options.viewId ? { view_id: options.viewId } : {});
    loaded.push({ ...table, fields, records });
  }

  const selectedIds = new Set(selected.map((table) => table.id));
  const outside = new Set<string>();
  for (const table of loaded) {
    for (const field of table.fields) {
      const linked = isLinkFieldType(field.type) ? linkedTableId(field) : undefined;
      if (linked && !selectedIds.has(linked)) outside.add(linked);
    }
  }
  const linkedTables: FeishuTable[] = [];
  for (const id of outside) {
    const name = tables.find((table) => table.id === id)?.name ?? id;
    const fields = await readFields(api, target.appToken, id);
    const primary = fields.find((field) => field.primary) ?? fields[0];
    if (!primary || !isSupportedFieldType(primary.type)) {
      linkedTables.push({ id, name, fields: [], records: [] });
      continue;
    }
    const records = await readRecords(api, target.appToken, { id, name }, { field_names: [primary.name] });
    linkedTables.push({ id, name, fields: [primary], records });
  }

  return {
    appToken: target.appToken,
    name: typeof meta.name === 'string' ? meta.name : '',
    timeZone,
    single: Boolean(target.tableId),
    tables: loaded,
    linkedTables,
  };
}
