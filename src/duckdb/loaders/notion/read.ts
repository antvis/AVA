import { notionOptionsSchema } from '../../../contracts/source/notion';

import { NOTION_DEFAULT_VERSION, NotionClient, NotionError, isObject } from './client';
import { supportedFields } from './convert';
import { createSnapshotBuilder } from './snapshot';

import type { NotionField, NotionCell } from './convert';
import type { NotionSourceOptions } from '../../../types';

const MAX_FIELDS = 2000;
const MAX_READ_BYTES = 16 * 1024 * 1024;
const MAX_PROPERTY_ITEMS = 100000;
const PROPERTY_PAGE_SIZE = 100;

export interface NotionSnapshot {
  fields: NotionField[];
  rows: Record<string, NotionCell>[];
}

function paginationCursor(page: Record<string, unknown>, hasMore: boolean): string | undefined {
  const next = page.next_cursor;
  if (hasMore && (typeof next !== 'string' || !next)) {
    throw new NotionError('Pagination did not return a valid next cursor.');
  }
  if (!hasMore && next !== null && next !== undefined) {
    throw new NotionError('Pagination returned a cursor for the final page.');
  }
  return hasMore ? (next as string) : undefined;
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
  consume?: (page: unknown) => void | Promise<void>
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
    const next = paginationCursor(page, page.has_more);
    for (const item of results) {
      const itemId = isObject(item) ? item.id : undefined;
      if (typeof itemId !== 'string' || !itemId || ids.has(itemId)) {
        throw new NotionError('Missing or repeated page id during pagination.');
      }
      ids.add(itemId);
    }
    count += results.length;
    if (consume) {
      for (const item of results) await consume(item);
    } else {
      pages.push(...results);
    }
    if (!page.has_more) return pages;
    if (!results.length) throw new NotionError('Pagination did not advance consistently.');
    cursor = next;
  }
}

/**
 * Read a property's independent cursor. List-valued properties return every
 * item; computed properties return the final typed value. In particular, a
 * rollup's calculation is not complete until its final property-item page.
 */
async function readCompleteProperty(
  client: Pick<NotionClient, 'retrievePropertyItem'>,
  field: NotionField,
  pageId: string
): Promise<unknown> {
  const items: unknown[] = [];
  const cursors = new Set<string>();
  let cursor: string | undefined;
  let itemCount = 0;
  let bytes = 0;
  for (;;) {
    const response = await client.retrievePropertyItem(pageId, field.id, cursor);
    bytes += Buffer.byteLength(JSON.stringify(response), 'utf8');
    if (bytes > MAX_READ_BYTES) throw new NotionError('Property-item response exceeds the 16 MiB read limit.');
    if (response.object === 'property_item') {
      if (cursor || items.length || response.type !== field.type || !['formula', 'rollup'].includes(field.type)) {
        throw new NotionError('Invalid property-item response.');
      }
      return response[field.type];
    }
    const results = response.results;
    const metadata = response.property_item;
    if (
      response.object !== 'list' ||
      response.type !== 'property_item' ||
      !Array.isArray(results) ||
      typeof response.has_more !== 'boolean' ||
      results.length > PROPERTY_PAGE_SIZE ||
      !isObject(metadata) ||
      metadata.type !== field.type
    ) {
      throw new NotionError('Invalid property-item pagination response.');
    }
    itemCount += results.length;
    if (itemCount > MAX_PROPERTY_ITEMS) {
      throw new NotionError('Property items exceed the configured read limit; no partial snapshot was loaded.');
    }
    const next = paginationCursor(response, response.has_more);
    for (const item of results) {
      if (!isObject(item) || item.object !== 'property_item') {
        throw new NotionError('Invalid item in property-item pagination.');
      }
      if (field.type === 'rollup') {
        // Rollup results contain relation/target property items; the calculated
        // value itself is metadata.rollup on the final response.
        continue;
      }
      if (item.type !== field.type) throw new NotionError('Property-item type changed during pagination.');
      items.push(item[field.type]);
    }
    if (!response.has_more) {
      if (field.type === 'rollup') return metadata.rollup;
      return items;
    }
    if (!results.length || !next || next === cursor || cursors.has(next)) {
      throw new NotionError('Property-item pagination did not advance consistently.');
    }
    cursors.add(next);
    cursor = next;
  }
}

function needsPropertyItems(field: NotionField, property: Record<string, unknown>): boolean {
  if (['people', 'formula', 'rollup'].includes(field.type)) return true;
  if (!['title', 'rich_text'].includes(field.type)) return false;
  const value = property[field.type];
  // Inline page/person mentions can be truncated at 25 entries. Exactly 25 is
  // also checked because the page value has no reliable has_more flag here.
  return property.has_more === true || (Array.isArray(value) && value.length >= 25);
}

async function completePage(
  client: Pick<NotionClient, 'retrievePropertyItem'>,
  fields: NotionField[],
  page: unknown
): Promise<unknown> {
  if (!isObject(page) || typeof page.id !== 'string' || !page.id || !isObject(page.properties)) return page;
  const properties = { ...page.properties };
  for (const field of fields) {
    const property = properties[field.name];
    if (!isObject(property) || property.type !== field.type || !needsPropertyItems(field, property)) continue;
    properties[field.name] = {
      ...property,
      [field.type]: await readCompleteProperty(client, field, page.id),
    };
  }
  return { ...page, properties };
}

/** Load a Notion database's fields and pages into a bounded, validated snapshot. */
export async function readNotionTable(input: NotionSourceOptions): Promise<NotionSnapshot> {
  const options = notionOptionsSchema.parse(input);
  const token = (options.token ?? process.env.NOTION_TOKEN)?.trim();
  if (!token || /[\r\n]/.test(token)) throw new NotionError('Set a valid token or NOTION_TOKEN.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 60000);
  const client = new NotionClient(
    controller.signal,
    token,
    options.version ?? NOTION_DEFAULT_VERSION,
    options.maxRetries ?? 2
  );
  try {
    const database = await client.retrieveDatabase(options.databaseId);
    const rawProperties = isObject(database) ? database.properties : undefined;
    if (!isObject(rawProperties)) throw new NotionError('Invalid database schema response.');
    const fields = supportedFields(Object.values(rawProperties));
    if (fields.length > MAX_FIELDS)
      throw new NotionError(`${fields.length} fields exceed the configured field read limit.`);
    const fingerprint = (list: NotionField[]) => list.map((f) => [f.id, f.name, f.type, f.sqlType]);
    // Computed SQL types are inferred while rows convert, so retain the schema
    // fingerprint before that inference for the final metadata comparison.
    const originalFingerprint = JSON.stringify(fingerprint(fields));
    const snapshot = createSnapshotBuilder(fields);
    await readPages(
      client,
      options.databaseId,
      options.pageSize ?? 100,
      Math.min(options.maxRecords ?? 10000, snapshot.maxRecords),
      async (page) => snapshot.append(await completePage(client, fields, page))
    );
    // Recheck property metadata in case the schema changed while reading.
    const latestDatabase = await client.retrieveDatabase(options.databaseId);
    const latestRaw = isObject(latestDatabase) ? latestDatabase.properties : undefined;
    if (!isObject(latestRaw)) throw new NotionError('Invalid database schema response.');
    const latest = supportedFields(Object.values(latestRaw));
    if (originalFingerprint !== JSON.stringify(fingerprint(latest))) {
      throw new NotionError('Property metadata changed during loading; retry the snapshot.');
    }
    return { fields, rows: snapshot.rows };
  } finally {
    clearTimeout(timer);
  }
}
