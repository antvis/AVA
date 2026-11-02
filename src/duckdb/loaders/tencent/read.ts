import { TencentDocsClient, TencentDocsError, isObject } from './client';
import { tencentDocsOptionsSchema } from './config';
import { supportedFields } from './convert';
import { createSnapshotBuilder } from './snapshot';

import type { TencentReadOperation } from './client';
import type { TencentCell, TencentField } from './convert';
import type { TencentDocsSourceOptions } from '../../../types';

const MAX_FIELDS = 1000;
const MAX_READ_BYTES = 16 * 1024 * 1024;

export interface TencentSnapshot {
  fields: TencentField[];
  rows: Record<string, TencentCell>[];
}

/** Fail closed on changing totals, skipped offsets or malformed pagination. */
export async function readPages(
  client: Pick<TencentDocsClient, 'call'>,
  operation: TencentReadOperation,
  args: Record<string, unknown>,
  key: 'fields' | 'records',
  limit: number,
  maximum: number,
  consume?: (item: unknown) => void
): Promise<unknown[]> {
  const items: unknown[] = [];
  const ids = new Set<string>();
  let offset = 0;
  let count = 0;
  let total: number | undefined;
  let bytes = 0;
  for (;;) {
    const page = await client.call(operation, { ...args, offset, limit });
    bytes += Buffer.byteLength(JSON.stringify(page), 'utf8');
    if (bytes > MAX_READ_BYTES) throw new TencentDocsError('Paginated response exceeds the 16 MiB read limit.');
    const batch = page[key];
    if (
      !Array.isArray(batch) ||
      batch.length > limit ||
      typeof page.hasMore !== 'boolean' ||
      !Number.isSafeInteger(page.total) ||
      (page.total as number) < 0
    )
      throw new TencentDocsError('Invalid pagination response.');
    if (total !== undefined && total !== page.total)
      throw new TencentDocsError('Table changed during pagination; retry the snapshot.');
    total = page.total as number;
    if (total > maximum || count + batch.length > maximum) {
      throw new TencentDocsError(`${key} exceed the configured read limit; no partial snapshot was loaded.`);
    }
    for (const item of batch) {
      const id = isObject(item) ? item[key === 'fields' ? 'fieldID' : 'recordID'] : undefined;
      if (typeof id !== 'string' || !id || ids.has(id)) {
        throw new TencentDocsError('Missing or repeated item ID during pagination.');
      }
      ids.add(id);
    }
    count += batch.length;
    if (count > total) throw new TencentDocsError('Pagination returned more items than its total.');
    if (!page.hasMore) {
      if (count !== total) throw new TencentDocsError('Incomplete snapshot; returned item count differs from total.');
    } else if (!batch.length || page.next !== offset + batch.length || count >= total) {
      throw new TencentDocsError('Pagination did not advance consistently.');
    }
    // Convert each validated page before fetching another; do not keep a second
    // copy of the entire sparse response alongside the expanded snapshot.
    if (consume) batch.forEach((item) => consume(item));
    else items.push(...batch);
    if (!page.hasMore) return items;
    offset = page.next as number;
  }
}

export async function readTencentTable(input: TencentDocsSourceOptions): Promise<TencentSnapshot> {
  const options = tencentDocsOptionsSchema.parse(input);
  const credentials = {
    clientId: (options.clientId ?? process.env.TENCENT_DOCS_CLIENT_ID ?? '').trim(),
    openId: (options.openId ?? process.env.TENCENT_DOCS_OPEN_ID ?? '').trim(),
    accessToken: (options.accessToken ?? process.env.TENCENT_DOCS_ACCESS_TOKEN ?? '').trim(),
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 60000);
  const client = new TencentDocsClient(controller.signal, options.maxRetries ?? 2);
  try {
    await client.connect(credentials);
    const args = { fileId: options.fileId, sheetId: options.sheetId };
    const metadata = await readPages(client, 'getFields', args, 'fields', options.pageSize ?? 100, MAX_FIELDS);
    const fields = supportedFields(metadata);
    const snapshot = createSnapshotBuilder(fields);
    await readPages(
      client,
      'getRecords',
      { ...args, fieldTitles: fields.map((field) => field.fieldTitle) },
      'records',
      options.pageSize ?? 100,
      Math.min(options.maxRecords ?? 10000, snapshot.maxRecords),
      snapshot.append
    );
    const latest = supportedFields(
      await readPages(client, 'getFields', args, 'fields', options.pageSize ?? 100, MAX_FIELDS)
    );
    if (JSON.stringify(fields) !== JSON.stringify(latest)) {
      throw new TencentDocsError('Field metadata changed during loading; retry the snapshot.');
    }
    return { fields, rows: snapshot.rows };
  } finally {
    clearTimeout(timer);
    // Cleanup must not replace a more useful loading error.
    await client.close().catch(() => undefined);
  }
}
