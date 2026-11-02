import { TencentDocsClient, TencentDocsError, isObject } from './client';
import { tencentDocsOptionsSchema } from './config';
import { convertRecord, supportedFields } from './convert';

import type { TencentReadTool } from './client';
import type { TencentCell, TencentField } from './convert';
import type { TencentDocsSourceOptions } from '../../../types';

const MAX_FIELDS = 1000;
const MAX_SNAPSHOT_BYTES = 16 * 1024 * 1024;

export interface TencentSnapshot {
  fields: TencentField[];
  rows: Record<string, TencentCell>[];
}

/** Fail closed on changing totals, skipped offsets or malformed pagination. */
export async function readPages(
  client: Pick<TencentDocsClient, 'call'>,
  tool: TencentReadTool,
  args: Record<string, unknown>,
  key: 'fields' | 'records',
  limit: number,
  maximum: number
): Promise<unknown[]> {
  const items: unknown[] = [];
  const ids = new Set<string>();
  let offset = 0;
  let total: number | undefined;
  let bytes = 0;
  for (;;) {
    const page = await client.call(tool, { ...args, offset, limit });
    bytes += Buffer.byteLength(JSON.stringify(page), 'utf8');
    if (bytes > MAX_SNAPSHOT_BYTES) throw new TencentDocsError('Snapshot exceeds the 16 MiB read limit.');
    const batch = page[key];
    if (
      !Array.isArray(batch) ||
      batch.length > limit ||
      typeof page.has_more !== 'boolean' ||
      !Number.isSafeInteger(page.total) ||
      (page.total as number) < 0
    )
      throw new TencentDocsError('Invalid pagination response.');
    if (total !== undefined && total !== page.total)
      throw new TencentDocsError('Table changed during pagination; retry the snapshot.');
    total = page.total as number;
    if (total > maximum || items.length + batch.length > maximum) {
      throw new TencentDocsError(`${key} exceed the configured read limit; no partial snapshot was loaded.`);
    }
    for (const item of batch) {
      const id = isObject(item) ? item[key === 'fields' ? 'field_id' : 'record_id'] : undefined;
      if (typeof id !== 'string' || !id || ids.has(id)) {
        throw new TencentDocsError('Missing or repeated item ID during pagination.');
      }
      ids.add(id);
    }
    items.push(...batch);
    if (items.length > total) throw new TencentDocsError('Pagination returned more items than its total.');
    if (!page.has_more) {
      if (items.length !== total)
        throw new TencentDocsError('Incomplete snapshot; returned item count differs from total.');
      return items;
    }
    if (!batch.length || page.next !== offset + batch.length || items.length >= total) {
      throw new TencentDocsError('Pagination did not advance consistently.');
    }
    offset = page.next as number;
  }
}

export async function readTencentTable(input: TencentDocsSourceOptions): Promise<TencentSnapshot> {
  const options = tencentDocsOptionsSchema.parse(input);
  const token = (options.token ?? process.env.TENCENT_DOCS_TOKEN)?.trim();
  if (!token || /[\r\n]/.test(token)) throw new TencentDocsError('Set a valid token or TENCENT_DOCS_TOKEN.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 60000);
  const client = new TencentDocsClient(controller.signal, options.maxRetries ?? 2);
  try {
    await client.connect(token);
    const args = { file_id: options.fileId, sheet_id: options.sheetId };
    const metadata = await readPages(client, 'smartsheet.list_fields', args, 'fields', 100, MAX_FIELDS);
    const fields = supportedFields(metadata);
    const records = await readPages(
      client,
      'smartsheet.list_records',
      { ...args, field_titles: fields.map((field) => field.field_title) },
      'records',
      options.pageSize ?? 100,
      options.maxRecords ?? 10000
    );
    const latest = supportedFields(await readPages(client, 'smartsheet.list_fields', args, 'fields', 100, MAX_FIELDS));
    if (JSON.stringify(fields) !== JSON.stringify(latest)) {
      throw new TencentDocsError('Field metadata changed during loading; retry the snapshot.');
    }
    return { fields, rows: records.map((record) => convertRecord(fields, record)) };
  } finally {
    clearTimeout(timer);
    // Closing the transport aborts its background SSE reader. A cleanup failure
    // must not replace a more useful loading error or leak upstream error text.
    await client.close().catch(() => undefined);
  }
}
