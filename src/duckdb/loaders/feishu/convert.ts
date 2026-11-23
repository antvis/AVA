/**
 * Convert Feishu Bitable cell values into typed column values.
 *
 * Every converter returns the values of one cell as a list (empty when the cell is
 * empty), tagged with a value kind. The loader turns a field into a scalar column when
 * no cell holds more than one value, and into a DuckDB list column otherwise.
 * Value formats follow the record value structure of the Bitable Open API.
 */

/** Field types reported by the field list API. */
export enum FeishuFieldType {
  Text = 1,
  Number = 2,
  SingleSelect = 3,
  MultiSelect = 4,
  DateTime = 5,
  Checkbox = 7,
  User = 11,
  Phone = 13,
  Url = 15,
  Attachment = 17,
  SingleLink = 18,
  Lookup = 19,
  Formula = 20,
  DuplexLink = 21,
  Location = 22,
  GroupChat = 23,
  Stage = 24,
  CreatedTime = 1001,
  ModifiedTime = 1002,
  CreatedUser = 1003,
  ModifiedUser = 1004,
  AutoNumber = 1005,
  Button = 3001,
}

/** Field metadata from the field list API. */
export interface FeishuField {
  id?: string;
  name: string;
  type: number;
  uiType?: string;
  primary?: boolean;
  property?: Record<string, unknown>;
}

export type FeishuScalar = string | number | boolean;

/** Value kinds and the DuckDB type of one value. */
export const VALUE_TYPES = {
  text: 'VARCHAR',
  number: 'DOUBLE',
  integer: 'BIGINT',
  boolean: 'BOOLEAN',
  date: 'DATE',
  timestamp: 'TIMESTAMP',
} as const;

export type ValueKind = keyof typeof VALUE_TYPES;

/** The values of one cell; an empty list means the cell is empty. */
export interface CellValues {
  kind: ValueKind;
  values: FeishuScalar[];
}

export interface ConvertContext {
  /** IANA time zone used to read dates as the wall-clock values shown in Feishu. */
  timeZone: string;
  /** Display text of a linked record, normally the primary field value of that record. */
  linkText: (tableId: string | undefined, recordId: string) => string;
}

const SUPPORTED_TYPES = new Set<number>([
  FeishuFieldType.Text,
  FeishuFieldType.Number,
  FeishuFieldType.SingleSelect,
  FeishuFieldType.MultiSelect,
  FeishuFieldType.DateTime,
  FeishuFieldType.Checkbox,
  FeishuFieldType.User,
  FeishuFieldType.Phone,
  FeishuFieldType.Url,
  FeishuFieldType.Attachment,
  FeishuFieldType.SingleLink,
  FeishuFieldType.Lookup,
  FeishuFieldType.Formula,
  FeishuFieldType.DuplexLink,
  FeishuFieldType.Location,
  FeishuFieldType.GroupChat,
  FeishuFieldType.CreatedTime,
  FeishuFieldType.ModifiedTime,
  FeishuFieldType.CreatedUser,
  FeishuFieldType.ModifiedUser,
  FeishuFieldType.AutoNumber,
]);

/** Field types whose cells hold a list of items, so a cell may contribute several values. */
const LIST_TYPES = new Set<number>([
  FeishuFieldType.MultiSelect,
  FeishuFieldType.User,
  FeishuFieldType.Attachment,
  FeishuFieldType.SingleLink,
  FeishuFieldType.DuplexLink,
  FeishuFieldType.GroupChat,
  FeishuFieldType.Lookup,
  FeishuFieldType.Formula,
]);

export function isSupportedFieldType(type: number): boolean {
  return SUPPORTED_TYPES.has(type);
}

export function isListFieldType(type: number): boolean {
  return LIST_TYPES.has(type);
}

export function isLinkFieldType(type: number): boolean {
  return type === FeishuFieldType.SingleLink || type === FeishuFieldType.DuplexLink;
}

/** Linked table of a link field, from its property. */
export function linkedTableId(field: FeishuField): string | undefined {
  const tableId = field.property?.table_id;
  return typeof tableId === 'string' && tableId ? tableId : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function items(value: unknown): unknown[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** Items of a list cell; lookups through several links nest one list per linked record. */
function flatItems(value: unknown): unknown[] {
  return items(value).reduce<unknown[]>(
    (all, item) => (Array.isArray(item) ? all.concat(flatItems(item)) : all.concat([item])),
    []
  );
}

function firstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return undefined;
}

function labels(value: unknown, keys: string[]): string[] {
  const result: string[] = [];
  for (const item of flatItems(value)) {
    const label = typeof item === 'string' ? item : isRecord(item) ? firstString(item, keys) : undefined;
    if (label) result.push(label);
  }
  return result;
}

function textOf(segment: unknown): string {
  if (typeof segment === 'string') return segment;
  if (typeof segment === 'number' || typeof segment === 'boolean') return String(segment);
  if (isRecord(segment) && typeof segment.text === 'string') return segment.text;
  return '';
}

/** Multi-line text is a list of segments (text, mention, url); join them into one string. */
export function asText(value: unknown): string | null {
  const text = items(value).map(textOf).join('').trim();
  return text === '' ? null : text;
}

export function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** Date-time fields of a time zone, cached per zone. */
const dateFormats = new Map<string, Intl.DateTimeFormat>();

function dateFormat(timeZone: string): Intl.DateTimeFormat {
  let format = dateFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    dateFormats.set(timeZone, format);
  }
  return format;
}

/** Throw a clear error for a time zone the runtime does not know. */
export function checkTimeZone(timeZone: string): string {
  try {
    dateFormat(timeZone);
  } catch {
    throw new Error(`Invalid Feishu Bitable time zone: ${timeZone}`);
  }
  return timeZone;
}

/**
 * Read a Unix millisecond timestamp as the wall-clock time of a time zone,
 * e.g. 1675526400000 in Asia/Shanghai is "2023-02-05 00:00:00.000".
 */
export function wallClock(ms: number, timeZone: string): string | null {
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  const parts: Record<string, string> = {};
  for (const { type, value } of dateFormat(timeZone).formatToParts(date)) parts[type] = value;
  const millis = String(((ms % 1000) + 1000) % 1000).padStart(3, '0');
  return `${parts.year.padStart(4, '0')}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${
    parts.second
  }.${millis}`;
}

/** Whether a date formatter shows the time; undefined when the field has no formatter. */
function showsTime(field: FeishuField): boolean | undefined {
  const formatter = field.property?.date_formatter;
  return typeof formatter === 'string' && formatter ? /[Hhms]/.test(formatter) : undefined;
}

function dateValues(value: unknown, kind: 'date' | 'timestamp', ctx: ConvertContext): CellValues {
  const values: string[] = [];
  for (const item of items(value)) {
    const ms = asNumber(item);
    const clock = ms === null ? null : wallClock(ms, ctx.timeZone);
    if (clock) values.push(kind === 'date' ? clock.slice(0, 10) : clock);
  }
  return { kind, values };
}

/** Record IDs of a link cell, in display order. */
export function linkRecordIds(value: unknown): string[] {
  const ids: string[] = [];
  for (const item of flatItems(value)) {
    if (typeof item === 'string' && item) ids.push(item);
    else if (isRecord(item)) {
      // Record APIs return { link_record_ids }; the legacy list API returns { record_ids, text_arr }.
      for (const key of ['link_record_ids', 'record_ids']) {
        const list = item[key];
        if (Array.isArray(list)) ids.push(...list.filter((id): id is string => typeof id === 'string' && id !== ''));
      }
    }
  }
  return ids;
}

const textCell = (value: string | null): CellValues => ({ kind: 'text', values: value === null ? [] : [value] });

function autoNumber(value: unknown): CellValues {
  const label = typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
  if (typeof label !== 'string' || label === '') return { kind: 'integer', values: [] };
  // Auto-increment numbers sort numerically; custom rules such as "NO-001" stay text.
  return /^\d{1,15}$/.test(label) ? { kind: 'integer', values: [Number(label)] } : textCell(label);
}

/** Kind of a field without values, used when no cell has a value. */
export function defaultKind(field: FeishuField): ValueKind {
  switch (field.type) {
    case FeishuFieldType.Number:
      return 'number';
    case FeishuFieldType.Checkbox:
      return 'boolean';
    case FeishuFieldType.DateTime:
      return showsTime(field) === true ? 'timestamp' : 'date';
    case FeishuFieldType.CreatedTime:
    case FeishuFieldType.ModifiedTime:
      return 'timestamp';
    case FeishuFieldType.AutoNumber: {
      const serial = field.property?.auto_serial;
      return isRecord(serial) && serial.type === 'custom' ? 'text' : 'integer';
    }
    default:
      return 'text';
  }
}

/**
 * Kind shared by several cells. Formula results can mix kinds; numbers widen to
 * DOUBLE, dates to TIMESTAMP, and any other mix falls back to text.
 */
export function commonKind(field: FeishuField, cells: CellValues[]): ValueKind {
  const kinds = new Set(cells.filter((cell) => cell.values.length > 0).map((cell) => cell.kind));
  if (kinds.size === 0) return defaultKind(field);
  if (kinds.size === 1) return [...kinds][0];
  if ([...kinds].every((kind) => kind === 'integer' || kind === 'number')) return 'number';
  if ([...kinds].every((kind) => kind === 'date' || kind === 'timestamp')) return 'timestamp';
  return 'text';
}

/** Cast a value of one kind to the kind chosen by commonKind. */
export function castValue(value: FeishuScalar, from: ValueKind, to: ValueKind): FeishuScalar {
  if (from === to || (to === 'number' && typeof value === 'number')) return value;
  if (to === 'timestamp' && from === 'date') return `${value} 00:00:00.000`;
  return String(value);
}

function mergeCells(field: FeishuField, cells: CellValues[]): CellValues {
  const kind = commonKind(field, cells);
  return { kind, values: cells.flatMap((cell) => cell.values.map((value) => castValue(value, cell.kind, kind))) };
}

const MAX_FORMULA_DEPTH = 5;

type Converter = (field: FeishuField, value: unknown, ctx: ConvertContext, depth: number) => CellValues;

/** Formula and lookup cells wrap the result as { type, value }; convert it as the wrapped type. */
function formulaValues(value: unknown, ctx: ConvertContext, depth: number, convert: Converter): CellValues {
  if (!isRecord(value) || typeof value.type !== 'number' || depth >= MAX_FORMULA_DEPTH) {
    return { kind: 'text', values: [] };
  }
  const inner: FeishuField = { name: '', type: value.type };
  if (!isSupportedFieldType(inner.type)) return { kind: 'text', values: [] };
  if (inner.type === FeishuFieldType.Formula || inner.type === FeishuFieldType.Lookup) {
    return mergeCells(
      inner,
      items(value.value).map((item) => formulaValues(item, ctx, depth + 1, convert))
    );
  }
  if (inner.type === FeishuFieldType.Text) return textCell(asText(value.value));
  if (isListFieldType(inner.type)) return convert(inner, value.value, ctx, depth + 1);
  // Scalar results arrive bare or as a list with one value per referenced record.
  return mergeCells(
    inner,
    items(value.value).map((item) => convert(inner, item, ctx, depth + 1))
  );
}

/**
 * Convert one cell. The field type decides the conversion; the result lists every
 * value of the cell, e.g. each selected option or each linked record.
 */
export function cellValues(field: FeishuField, value: unknown, ctx: ConvertContext, depth = 0): CellValues {
  switch (field.type) {
    case FeishuFieldType.Text:
    case FeishuFieldType.Phone:
    case FeishuFieldType.SingleSelect:
      return textCell(asText(value));
    case FeishuFieldType.Number:
      return {
        kind: 'number',
        values: items(value)
          .map(asNumber)
          .filter((number): number is number => number !== null),
      };
    case FeishuFieldType.MultiSelect:
      return { kind: 'text', values: labels(value, ['name', 'text']) };
    case FeishuFieldType.DateTime: {
      const time = showsTime(field);
      if (time !== undefined) return dateValues(value, time ? 'timestamp' : 'date', ctx);
      // Without a formatter, keep the time unless the value is a local midnight.
      const cell = dateValues(value, 'timestamp', ctx);
      return cell.values.every((clock) => String(clock).endsWith(' 00:00:00.000'))
        ? { kind: 'date', values: cell.values.map((clock) => String(clock).slice(0, 10)) }
        : cell;
    }
    case FeishuFieldType.CreatedTime:
    case FeishuFieldType.ModifiedTime:
      return dateValues(value, 'timestamp', ctx);
    case FeishuFieldType.Checkbox:
      // An unchecked box is omitted from the record, so a missing value means false.
      return { kind: 'boolean', values: [items(value).some((item) => item === true || item === 'true')] };
    case FeishuFieldType.User:
    case FeishuFieldType.CreatedUser:
    case FeishuFieldType.ModifiedUser:
      return { kind: 'text', values: labels(value, ['name', 'en_name', 'email', 'id']) };
    case FeishuFieldType.Url:
      return { kind: 'text', values: labels(value, ['text', 'link']) };
    case FeishuFieldType.Attachment:
      return { kind: 'text', values: labels(value, ['name', 'file_token']) };
    case FeishuFieldType.SingleLink:
    case FeishuFieldType.DuplexLink: {
      const tableId = linkedTableId(field);
      return { kind: 'text', values: linkRecordIds(value).map((id) => ctx.linkText(tableId, id)) };
    }
    case FeishuFieldType.Location:
      return { kind: 'text', values: labels(value, ['full_address', 'name', 'address', 'location']) };
    case FeishuFieldType.GroupChat:
      return { kind: 'text', values: labels(value, ['name', 'id']) };
    case FeishuFieldType.AutoNumber:
      return autoNumber(value);
    case FeishuFieldType.Formula:
    case FeishuFieldType.Lookup:
      return formulaValues(value, ctx, depth, cellValues);
    default:
      throw new Error(`Unsupported field type: ${field.type}`);
  }
}

/** Plain text of a cell, used to label linked records. */
export function displayText(cell: CellValues): string | undefined {
  return cell.values.length === 0 ? undefined : cell.values.map(String).join(', ');
}
