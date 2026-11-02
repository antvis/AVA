import { isObject, TencentDocsError } from './client';

export interface TencentField {
  field_id: string;
  field_title: string;
  field_type: string;
}

export type TencentCell = string | number | boolean | null;

const SQL_TYPES: Record<string, string> = {
  text: 'VARCHAR',
  number: 'DOUBLE',
  checkbox: 'BOOLEAN',
  dateTime: 'TIMESTAMPTZ',
  createdTime: 'TIMESTAMPTZ',
  modifiedTime: 'TIMESTAMPTZ',
  singleSelect: 'VARCHAR',
  phoneNumber: 'VARCHAR',
  email: 'VARCHAR',
  currency: 'DOUBLE',
  percentage: 'DOUBLE',
  progress: 'DOUBLE',
};

export function supportedFields(raw: unknown[]): TencentField[] {
  const names = new Set(['_record_id']);
  const ids = new Set<string>();
  const fields: TencentField[] = [];
  for (const field of raw) {
    if (
      !isObject(field) ||
      typeof field.field_id !== 'string' ||
      !field.field_id ||
      typeof field.field_title !== 'string' ||
      !field.field_title.trim() ||
      typeof field.field_type !== 'string'
    )
      throw new TencentDocsError('Invalid field metadata.');
    if (ids.has(field.field_id)) throw new TencentDocsError('Duplicate field ID; the table may have changed.');
    ids.add(field.field_id);
    if (!Object.prototype.hasOwnProperty.call(SQL_TYPES, field.field_type)) continue;
    // DuckDB identifiers are case insensitive. Do not let it silently rename columns.
    const name = field.field_title.toLowerCase();
    if (names.has(name)) throw new TencentDocsError('Duplicate or reserved column name. Rename the source field.');
    names.add(name);
    fields.push({ field_id: field.field_id, field_title: field.field_title, field_type: field.field_type });
  }
  if (!fields.length) throw new TencentDocsError('The table has no supported fields.');
  return fields;
}

export function columnTypes(fields: TencentField[]): Record<string, string> {
  return Object.fromEntries([
    ['_record_id', 'VARCHAR'],
    ...fields.map((f) => [f.field_title, SQL_TYPES[f.field_type]]),
  ]);
}

function invalidCell(): never {
  // Do not expose cell contents in lifecycle error events or CLI diagnostics.
  throw new TencentDocsError('Invalid value for a supported field type; no partial snapshot was loaded.');
}

function convertCell(field: TencentField, cell: Record<string, unknown>): TencentCell {
  switch (field.field_type) {
    case 'text': {
      if (!isObject(cell.text_value) || !Array.isArray(cell.text_value.items)) return invalidCell();
      return cell.text_value.items
        .map((item) => {
          if (!isObject(item) || typeof item.text !== 'string') return invalidCell();
          return item.text;
        })
        .join('');
    }
    case 'number':
    case 'currency':
    case 'percentage':
    case 'progress':
      if (typeof cell.number_value !== 'number' || !Number.isFinite(cell.number_value)) return invalidCell();
      return cell.number_value;
    case 'checkbox':
      if (typeof cell.bool_value !== 'boolean') return invalidCell();
      return cell.bool_value;
    case 'dateTime':
    case 'createdTime':
    case 'modifiedTime': {
      if (typeof cell.string_value !== 'string' || !/^-?\d+$/.test(cell.string_value)) return invalidCell();
      const ms = Number(cell.string_value);
      if (!Number.isSafeInteger(ms)) return invalidCell();
      const date = new Date(ms);
      return Number.isNaN(date.getTime()) ? invalidCell() : date.toISOString();
    }
    case 'singleSelect': {
      if (!isObject(cell.option_value) || !Array.isArray(cell.option_value.items)) return invalidCell();
      const items = cell.option_value.items;
      if (!items.length) return null;
      if (items.length !== 1 || !isObject(items[0]) || typeof items[0].text !== 'string') return invalidCell();
      return items[0].text;
    }
    case 'phoneNumber':
    case 'email':
      return typeof cell.string_value === 'string' ? cell.string_value : invalidCell();
    default:
      return invalidCell();
  }
}

export function convertRecord(fields: TencentField[], raw: unknown): Record<string, TencentCell> {
  if (!isObject(raw) || typeof raw.record_id !== 'string' || !raw.record_id || !Array.isArray(raw.field_values)) {
    throw new TencentDocsError('Invalid record response.');
  }
  const values = new Map<string, Record<string, unknown>>();
  const names = new Set(fields.map((field) => field.field_title));
  for (const cell of raw.field_values) {
    if (!isObject(cell) || typeof cell.field !== 'string' || values.has(cell.field) || !names.has(cell.field)) {
      throw new TencentDocsError('Invalid or duplicate record field.');
    }
    values.set(cell.field, cell);
  }
  return Object.fromEntries([
    ['_record_id', raw.record_id],
    ...fields.map((field) => {
      const cell = values.get(field.field_title);
      return [field.field_title, cell ? convertCell(field, cell) : null];
    }),
  ]);
}
