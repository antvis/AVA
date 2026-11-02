import { isObject, TencentDocsError } from './client';

export interface TencentField {
  fieldID: string;
  fieldTitle: string;
  fieldType: number;
}

export type TencentCell = string | number | boolean | null;

// Official numeric FieldType / Value contracts, not the MCP string enums.
// The legacy v2 enum page is incomplete: currency 26 / percentage 28 have been
// confirmed through official service metadata and native OpenAPI round trips.
// See examples/tencent-docs/OPENAPI_FIELDS.md for contracts and live evidence.
const SQL_TYPES: Record<number, string> = {
  1: 'VARCHAR',
  2: 'DOUBLE',
  3: 'BOOLEAN',
  4: 'TIMESTAMPTZ',
  12: 'TIMESTAMPTZ',
  13: 'TIMESTAMPTZ',
  14: 'DOUBLE',
  15: 'VARCHAR',
  16: 'VARCHAR',
  17: 'VARCHAR',
  26: 'DOUBLE',
  28: 'DOUBLE',
};

export function supportedFields(raw: unknown[]): TencentField[] {
  const names = new Set(['_record_id']);
  const ids = new Set<string>();
  const fields: TencentField[] = [];
  for (const field of raw) {
    if (
      !isObject(field) ||
      typeof field.fieldID !== 'string' ||
      !field.fieldID ||
      typeof field.fieldTitle !== 'string' ||
      !field.fieldTitle.trim() ||
      !Number.isSafeInteger(field.fieldType)
    ) {
      throw new TencentDocsError('Invalid field metadata.');
    }
    if (ids.has(field.fieldID)) throw new TencentDocsError('Duplicate field ID; the table may have changed.');
    ids.add(field.fieldID);
    if (!Object.prototype.hasOwnProperty.call(SQL_TYPES, field.fieldType as number)) continue;
    const name = field.fieldTitle.toLowerCase();
    if (names.has(name)) throw new TencentDocsError('Duplicate or reserved column name. Rename the source field.');
    names.add(name);
    fields.push({ fieldID: field.fieldID, fieldTitle: field.fieldTitle, fieldType: field.fieldType as number });
  }
  if (!fields.length) throw new TencentDocsError('The table has no supported fields.');
  return fields;
}

export function columnTypes(fields: TencentField[]): Record<string, string> {
  return Object.fromEntries([['_record_id', 'VARCHAR'], ...fields.map((f) => [f.fieldTitle, SQL_TYPES[f.fieldType]])]);
}

function invalidCell(): never {
  throw new TencentDocsError('Invalid value for a supported field type; no partial snapshot was loaded.');
}

function convertCell(field: TencentField, value: unknown): TencentCell {
  if (value === null) return null;
  switch (field.fieldType) {
    case 1:
      if (!Array.isArray(value)) return invalidCell();
      return value
        .map((item) => (isObject(item) && typeof item.text === 'string' ? item.text : invalidCell()))
        .join('');
    case 2:
    case 14:
    case 26:
    case 28:
      return typeof value === 'number' && Number.isFinite(value) ? value : invalidCell();
    case 3:
      return typeof value === 'boolean' ? value : invalidCell();
    case 4:
    case 12:
    case 13: {
      if (typeof value !== 'string' || !/^-?\d+$/.test(value)) return invalidCell();
      const ms = Number(value);
      if (!Number.isSafeInteger(ms)) return invalidCell();
      const date = new Date(ms);
      return Number.isNaN(date.getTime()) ? invalidCell() : date.toISOString();
    }
    case 15:
    case 16:
      return typeof value === 'string' ? value : invalidCell();
    case 17:
      if (!Array.isArray(value)) return invalidCell();
      if (!value.length) return null;
      return value.length === 1 && isObject(value[0]) && typeof value[0].text === 'string'
        ? value[0].text
        : invalidCell();
    default:
      return invalidCell();
  }
}

export function convertRecord(fields: TencentField[], raw: unknown): Record<string, TencentCell> {
  if (!isObject(raw) || typeof raw.recordID !== 'string' || !raw.recordID || !isObject(raw.values)) {
    throw new TencentDocsError('Invalid record response.');
  }
  const values = raw.values;
  const names = new Set(fields.map((field) => field.fieldTitle));
  if (Object.keys(values).some((name) => !names.has(name)))
    throw new TencentDocsError('Invalid or unknown projected record field.');
  return Object.fromEntries([
    ['_record_id', raw.recordID],
    ...fields.map((field) => {
      if (Object.prototype.hasOwnProperty.call(values, field.fieldTitle)) {
        return [field.fieldTitle, convertCell(field, values[field.fieldTitle])];
      }
      // v2 omits system-time cells from values. These exact native types map
      // to documented record-level millisecond metadata, verified on real rows.
      // Never override an explicit null/value or infer from a column title.
      const systemTime = field.fieldType === 12 ? raw.createTime : field.fieldType === 13 ? raw.updateTime : undefined;
      return [field.fieldTitle, systemTime === undefined ? null : convertCell(field, systemTime)];
    }),
  ]);
}
