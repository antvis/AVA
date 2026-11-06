import { TencentDocsClient, TencentDocsError, isObject } from './client';
import { tencentDocsOptionsSchema } from './config';
import { supportedFields } from './convert';
import { createSnapshotBuilder } from './snapshot';

import type { TencentCell, TencentField } from './convert';
import type { TencentDocsSourceOptions } from '../../../types';

const MAX_FIELDS = 1000;
const MAX_READ_BYTES = 16 * 1024 * 1024;

export interface TencentSnapshot {
  fields: TencentField[];
  rows: Record<string, TencentCell>[];
}

interface PageState {
  offset: number;
  count: number;
  total?: number;
  bytes: number;
  ids: Set<string>;
}

/** Validate completeness before consuming a page; never silently truncate a snapshot. */
function validatePage(
  page: Record<string, unknown>,
  key: 'fields' | 'records',
  state: PageState,
  limit: number,
  maximum: number
): unknown[] {
  state.bytes += Buffer.byteLength(JSON.stringify(page), 'utf8');
  if (state.bytes > MAX_READ_BYTES) throw new TencentDocsError('Paginated response exceeds the 16 MiB read limit.');
  const batch = page[key];
  if (
    !Array.isArray(batch) ||
    batch.length > limit ||
    typeof page.hasMore !== 'boolean' ||
    !Number.isSafeInteger(page.total) ||
    (page.total as number) < 0
  ) {
    throw new TencentDocsError('Invalid pagination response.');
  }
  if (state.total !== undefined && state.total !== page.total)
    throw new TencentDocsError('Table changed during pagination; retry the snapshot.');
  state.total = page.total as number;
  if (state.total > maximum || state.count + batch.length > maximum)
    throw new TencentDocsError(`${key} exceed the configured read limit; no partial snapshot was loaded.`);
  for (const item of batch) {
    const id = isObject(item) ? item[key === 'fields' ? 'fieldID' : 'recordID'] : undefined;
    if (typeof id !== 'string' || !id || state.ids.has(id))
      throw new TencentDocsError('Missing or repeated item ID during pagination.');
    state.ids.add(id);
  }
  state.count += batch.length;
  if (state.count > state.total) throw new TencentDocsError('Pagination returned more items than its total.');
  if (!page.hasMore) {
    if (state.count !== state.total)
      throw new TencentDocsError('Incomplete snapshot; returned item count differs from total.');
  } else if (!batch.length || page.next !== state.offset + batch.length || state.count >= state.total) {
    throw new TencentDocsError('Pagination did not advance consistently.');
  }
  state.offset = page.next as number;
  return batch;
}

export async function readFields(
  client: Pick<TencentDocsClient, 'call'>,
  args: { fileId: string; sheetId: string },
  limit: number
): Promise<TencentField[]> {
  const state: PageState = { offset: 0, count: 0, bytes: 0, ids: new Set() };
  const fields: unknown[] = [];
  for (;;) {
    const page = await client.call('getFields', { ...args, offset: state.offset, limit });
    fields.push(...validatePage(page, 'fields', state, limit, MAX_FIELDS));
    if (!page.hasMore) return supportedFields(fields);
  }
}

export async function readRecords(
  client: Pick<TencentDocsClient, 'call'>,
  args: { fileId: string; sheetId: string; fieldTitles: string[] },
  limit: number,
  maximum: number,
  append: (record: unknown) => void
): Promise<void> {
  const state: PageState = { offset: 0, count: 0, bytes: 0, ids: new Set() };
  for (;;) {
    const page = await client.call('getRecords', { ...args, offset: state.offset, limit });
    // Convert before fetching another page; do not retain a second raw-record snapshot.
    for (const record of validatePage(page, 'records', state, limit, maximum)) append(record);
    if (!page.hasMore) return;
  }
}

export async function readTencentTable(input: TencentDocsSourceOptions): Promise<TencentSnapshot> {
  const options = tencentDocsOptionsSchema.parse(input);
  const credentials = {
    clientId: options.clientId,
    openId: options.openId,
    accessToken: options.accessToken,
  };
  const controller = new AbortController();
  const client = new TencentDocsClient(credentials, controller.signal, options.maxRetries ?? 2);
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 60000);
  try {
    const args = { fileId: options.fileId, sheetId: options.sheetId };
    const fields = await readFields(client, args, options.pageSize ?? 100);
    const snapshot = createSnapshotBuilder(fields);
    await readRecords(
      client,
      { ...args, fieldTitles: fields.map((field) => field.fieldTitle) },
      options.pageSize ?? 100,
      Math.min(options.maxRecords ?? 10000, snapshot.maxRecords),
      snapshot.append
    );
    const latest = await readFields(client, args, options.pageSize ?? 100);
    if (JSON.stringify(fields) !== JSON.stringify(latest)) {
      throw new TencentDocsError('Field metadata changed during loading; retry the snapshot.');
    }
    return { fields, rows: snapshot.rows };
  } finally {
    clearTimeout(timer);
  }
}
