import { NotionClient, NotionError, isObject } from './client';
import { notionOptionsSchema } from './config';
import { supportedFields } from './convert';
import { createSnapshotBuilder } from './snapshot';

import type { NotionField, NotionCell } from './convert';
import type { NotionSourceOptions } from '../../../types';

const MAX_FIELDS = 2000;
const MAX_READ_BYTES = 16 * 1024 * 1024;

export interface NotionSnapshot {
  fields: NotionField[];
  rows: Record<string, NotionCell>[];
}

/**
 * Fail closed on changing totals, repeated page ids, or malformed pagination.
 * Cursor-based database query only; the connector never sends a filter or a
 * write operation.
 */
export async function readPages(
  client: Pick<NotionClient, 'queryDatabase'>,
  databaseId: string,
  pageSize: number,
  maximum: number,
  consume?: (page: unknown) => void
): Promise<unknown[]> {
  const pages: unknown[] = [];
  const ids = new Set<string>();
  let cursor: string | undefined;
  let count = 0;
  let bytes = 0;
  for (;;) {
    const body: Record<string, unknown> = { page_size: pageSize };
    if (cursor) body.start_cursor = cursor;
    const page = await client.queryDatabase(databaseId, body);
    bytes += Buffer.byteLength(JSON.stringify(page), 'utf8');
    if (bytes > MAX_READ_BYTES) throw new NotionError('Paginated response exceeds the 16 MiB read limit.');
    const results = isObject(page) ? page.results : undefined;
    if (
      page.object !== 'list' ||
      !Array.isArray(results) ||
      typeof page.has_more !== 'boolean' ||
      results.length > pageSize
    ) {
      throw new NotionError('Invalid pagination response.');
    }
    if (count + results.length > maximum) {
      throw new NotionError('Pages exceed the configured read limit; no partial snapshot was loaded.');
    }
    const next = page.next_cursor;
    if (page.has_more && (typeof next !== 'string' || !next)) {
      throw new NotionError('Pagination did not return a valid next cursor.');
    }
    if (!page.has_more && next !== null && next !== undefined) {
      throw new NotionError('Pagination returned a cursor for the final page.');
    }
    for (const item of results) {
      const itemId = isObject(item) ? item.id : undefined;
      if (typeof itemId !== 'string' || !itemId || ids.has(itemId)) {
        throw new NotionError('Missing or repeated page id during pagination.');
      }
      ids.add(itemId);
    }
    count += results.length;
    if (consume) results.forEach((item) => consume(item));
    else pages.push(...results);
    if (!page.has_more) return pages;
    if (!results.length) throw new NotionError('Pagination did not advance consistently.');
    cursor = next as string;
  }
}

/** Load a Notion database's fields and pages into a bounded, validated snapshot. */
export async function readNotionTable(input: NotionSourceOptions): Promise<NotionSnapshot> {
  const options = notionOptionsSchema.parse(input);
  const token = (options.token ?? process.env.NOTION_TOKEN)?.trim();
  if (!token || /[\r\n]/.test(token)) throw new NotionError('Set a valid token or NOTION_TOKEN.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 60000);
  const client = new NotionClient(controller.signal, token, options.version ?? '2022-06-28', options.maxRetries ?? 2);
  try {
    const database = await client.retrieveDatabase(options.databaseId);
    const rawProperties = isObject(database) ? database.properties : undefined;
    if (!isObject(rawProperties)) throw new NotionError('Invalid database schema response.');
    const fields = supportedFields(Object.values(rawProperties));
    if (fields.length > MAX_FIELDS) throw new NotionError(`${fields.length} fields exceed the configured field read limit.`);
    const snapshot = createSnapshotBuilder(fields);
    await readPages(
      client,
      options.databaseId,
      options.pageSize ?? 100,
      Math.min(options.maxRecords ?? 10000, snapshot.maxRecords),
      snapshot.append
    );
    // Recheck property metadata in case the schema changed while reading.
    const latestDatabase = await client.retrieveDatabase(options.databaseId);
    const latestRaw = isObject(latestDatabase) ? latestDatabase.properties : undefined;
    if (!isObject(latestRaw)) throw new NotionError('Invalid database schema response.');
    const latest = supportedFields(Object.values(latestRaw));
    const fingerprint = (list: NotionField[]) => list.map((f) => [f.id, f.name, f.type, f.sqlType]);
    if (JSON.stringify(fingerprint(fields)) !== JSON.stringify(fingerprint(latest))) {
      throw new NotionError('Property metadata changed during loading; retry the snapshot.');
    }
    return { fields, rows: snapshot.rows };
  } finally {
    clearTimeout(timer);
  }
}