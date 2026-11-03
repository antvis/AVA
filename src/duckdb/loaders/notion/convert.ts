import { isObject, NotionError } from './client';

/** A supported Notion database property, with its SQL column mapping. */
export interface NotionField {
  id: string;
  name: string;
  type: string;
  sqlType: string;
}

export type NotionCell = string | number | boolean | null;

/** Notion property types mapped to DuckDB column types. */
const SQL_TYPES: Record<string, string> = {
  title: 'VARCHAR',
  rich_text: 'VARCHAR',
  number: 'DOUBLE',
  select: 'VARCHAR',
  multi_select: 'VARCHAR',
  status: 'VARCHAR',
  date: 'TIMESTAMPTZ',
  checkbox: 'BOOLEAN',
  url: 'VARCHAR',
  email: 'VARCHAR',
  phone_number: 'VARCHAR',
  created_time: 'TIMESTAMPTZ',
  last_edited_time: 'TIMESTAMPTZ',
  created_by: 'VARCHAR',
  last_edited_by: 'VARCHAR',
  people: 'VARCHAR',
  unique_id: 'VARCHAR',
  formula: 'VARCHAR',
  rollup: 'VARCHAR',
};

/** Resolve the concrete SQL type, following formula/rollup result types. */
function fieldSQLType(item: Record<string, unknown>): string | null {
  const type = typeof item.type === 'string' ? item.type : '';
  if (type === 'formula' || type === 'rollup') {
    const config = item[type];
    const resultType = isObject(config) ? config.type : undefined;
    if (resultType === 'number') return 'DOUBLE';
    if (resultType === 'boolean') return 'BOOLEAN';
    return resultType === 'string' ? 'VARCHAR' : null;
  }
  return SQL_TYPES[type] ?? null;
}

/**
 * Validate the database's property schema and return only the properties
 * DuckDB can represent. Complex/unsupported types (files, relation, button,
 * place, verification) and malformed entries are excluded; a database with no
 * supported properties fails rather than loading an all-unknown table.
 */
export function supportedFields(raw: unknown[]): NotionField[] {
  const names = new Set(['_id']);
  const ids = new Set<string>();
  const fields: NotionField[] = [];
  for (const item of raw) {
    if (!isObject(item) || typeof item.id !== 'string' || !item.id || typeof item.name !== 'string') {
      throw new NotionError('Invalid property schema in Notion database.');
    }
    if (ids.has(item.id)) throw new NotionError('Duplicate property id; the database schema may have changed.');
    ids.add(item.id);
    const type = typeof item.type === 'string' ? item.type : '';
    if (!Object.prototype.hasOwnProperty.call(SQL_TYPES, type)) continue;
    const sqlType = fieldSQLType(item);
    if (!sqlType) continue;
    // DuckDB identifiers are case insensitive; do not let it silently rename columns.
    const name = item.name.toLowerCase();
    if (names.has(name)) throw new NotionError('Duplicate or reserved column name. Rename the source property.');
    names.add(name);
    fields.push({ id: item.id, name: item.name, type, sqlType });
  }
  if (!fields.length) throw new NotionError('The database has no supported properties.');
  return fields;
}

/** Map supported fields to DuckDB column types. */
export function columnTypes(fields: NotionField[]): Record<string, string> {
  return Object.fromEntries([['_id', 'VARCHAR'], ...fields.map((f) => [f.name, f.sqlType])]);
}

function invalidCell(): never {
  throw new NotionError('Invalid value for a supported property type; no partial snapshot was loaded.');
}

/** Concatenate rich text/title segments in order, preserving empty strings. */
function toPlainText(value: unknown): string {
  if (!Array.isArray(value)) return invalidCell();
  let text = '';
  for (const item of value) {
    if (!isObject(item) || typeof item.plain_text !== 'string') return invalidCell();
    text += item.plain_text;
  }
  return text;
}

function namesList(value: unknown): string | null {
  if (!Array.isArray(value)) return invalidCell();
  const names = value.map((entry) => {
    if (!isObject(entry) || typeof entry.name !== 'string') return invalidCell();
    return entry.name;
  });
  return names.length ? names.join(', ') : null;
}

function uniqueId(value: unknown): string | null {
  if (!isObject(value)) return invalidCell();
  const { number, prefix } = value;
  if (number !== null && typeof number !== 'number') return invalidCell();
  if (prefix !== null && typeof prefix !== 'string') return invalidCell();
  return [typeof prefix === 'string' && prefix ? `${prefix}-` : '', number ?? ''].join('');
}

function dateValue(value: unknown): string | null {
  if (!isObject(value)) return invalidCell();
  const { start, time_zone } = value;
  if (typeof start !== 'string') return invalidCell();
  // Notion returns concrete timestamps with a numeric UTC offset rather than a
  // named zone, so normalize them to an absolute UTC instant. A pure date (no
  // time component) is preserved as-is for the TIMESTAMPTZ column.
  let normalized = start;
  if (time_zone == null && /T\d{2}:\d{2}/.test(start) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(start)) {
    const parsed = new Date(`${start}Z`);
    if (Number.isNaN(parsed.getTime())) return invalidCell();
    normalized = parsed.toISOString();
  }
  return normalized;
}

function computedDate(raw: unknown): string | null {
  if (typeof raw !== 'string') return invalidCell();
  if (/T\d{2}:\d{2}/.test(raw) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(raw)) {
    const parsed = new Date(`${raw}Z`);
    if (Number.isNaN(parsed.getTime())) return invalidCell();
    return parsed.toISOString();
  }
  return raw;
}

function computedCell(value: unknown): NotionCell {
  if (!isObject(value)) return invalidCell();
  const type = typeof value.type === 'string' ? value.type : '';
  const raw = value[type];
  if (type === 'number') return typeof raw === 'number' && Number.isFinite(raw) ? raw : raw === null ? null : invalidCell();
  if (type === 'boolean') return typeof raw === 'boolean' ? raw : invalidCell();
  if (type === 'string') return typeof raw === 'string' ? raw : invalidCell();
  if (type === 'date') return raw === null ? null : computedDate(raw);
  return invalidCell();
}

function convertCell(field: NotionField, raw: unknown): NotionCell {
  switch (field.type) {
    case 'title':
    case 'rich_text':
      return toPlainText(raw);
    case 'number':
      return typeof raw === 'number' ? raw : raw === null ? null : invalidCell();
    case 'select':
      return isObject(raw) ? (typeof raw.name === 'string' ? raw.name : invalidCell()) : raw === null ? null : invalidCell();
    case 'multi_select':
      return namesList(raw);
    case 'status':
      return isObject(raw) ? (typeof raw.name === 'string' ? raw.name : invalidCell()) : raw === null ? null : invalidCell();
    case 'date':
      return raw === null ? null : dateValue(raw);
    case 'checkbox':
      return typeof raw === 'boolean' ? raw : invalidCell();
    case 'url':
    case 'email':
    case 'phone_number':
      return typeof raw === 'string' ? raw : raw === null ? null : invalidCell();
    case 'created_time':
    case 'last_edited_time':
      return typeof raw === 'string' ? raw : invalidCell();
    case 'created_by':
    case 'last_edited_by':
      return isObject(raw) ? (typeof raw.name === 'string' ? raw.name : invalidCell()) : invalidCell();
    case 'people':
      return namesList(raw);
    case 'unique_id':
      return raw === null ? null : uniqueId(raw);
    case 'formula':
    case 'rollup':
      return computedCell(raw);
    default:
      return invalidCell();
  }
}

/** Convert one page's properties map to a dense, validated row. */
export function convertPage(fields: NotionField[], page: unknown): Record<string, NotionCell> {
  if (!isObject(page) || typeof page.id !== 'string' || !page.id || !isObject(page.properties)) {
    throw new NotionError('Invalid page response from Notion.');
  }
  const values = new Map<string, unknown>();
  for (const [name, property] of Object.entries(page.properties)) {
    if (!isObject(property) || typeof property.type !== 'string') throw new NotionError('Invalid page property.');
    if (values.has(name)) throw new NotionError('Duplicate page property key.');
    values.set(name, property[property.type]);
  }
  return Object.fromEntries([
    ['_id', page.id],
    ...fields.map((field) => {
      const raw = values.get(field.name);
      return [field.name, raw === undefined ? null : convertCell(field, raw)];
    }),
  ]);
}