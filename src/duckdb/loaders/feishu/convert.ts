export type FeishuCell = string | number | boolean | null;

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

const supportedFieldTypes = new Set<number>([
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

export function isSupportedFieldType(type: number): boolean {
  return supportedFieldTypes.has(type);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function firstString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return null;
}

function joinLabels(values: unknown[], read: (value: unknown) => string | null): string | null {
  const labels: string[] = [];
  for (const value of values) {
    const label = read(value);
    if (label) labels.push(label);
  }
  return labels.length === 0 ? null : labels.join(',');
}

export function asString(value: unknown): string | null {
  if (typeof value === 'string') return value === '' ? null : value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return null;
}

function textOf(segment: unknown): string {
  if (typeof segment === 'string') return segment;
  if (segment && typeof segment === 'object') {
    const text = (segment as { text?: unknown }).text;
    if (typeof text === 'string') return text;
  }
  return '';
}

export function asMultiSelect(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const names: string[] = [];
  for (const item of value) {
    if (typeof item === 'string' && item !== '') names.push(item);
  }
  return names.length === 0 ? null : names.join(',');
}

export function asCheckbox(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  return null;
}

export function asText(value: unknown): string | null {
  if (!Array.isArray(value)) return asString(value);
  const text = value
    .map((segment) => textOf(segment))
    .join('')
    .trim();
  return text === '' ? null : text;
}

export function asPhone(value: unknown): string | null {
  if (typeof value !== 'string' || value === '') return null;
  return value;
}

export function asSingleSelect(value: unknown): string | null {
  if (typeof value !== 'string' || value === '') return null;
  return value;
}

export function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  // 飞书数字字段可能返回 number，也可能返回字符串（如 "100"）
  if (typeof value === 'string' && value.trim() === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function asTimestamp(value: unknown): string | null {
  const ms = asNumber(value);
  if (ms === null) return null;
  const date = new Date(ms);
  // 超出 Date 可表示范围时 getTime() 为 NaN，此时 toISOString() 会抛错
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function asUrl(value: unknown): string | null {
  if (typeof value === 'string') return value === '' ? null : value;
  if (!value || typeof value !== 'object') return null;
  const link = value as { text?: unknown; link?: unknown };
  if (typeof link.text === 'string' && link.text !== '') return link.text;
  if (typeof link.link === 'string' && link.link !== '') return link.link;
  return null;
}

export function asAutoNumber(value: unknown): string | null {
  // 文档约定返回值是 string，这里同时兼容部分接口返回 number 的情况
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value !== '') return value;
  return null;
}

function userLabel(value: unknown): string | null {
  if (typeof value === 'string') return value === '' ? null : value;
  if (!isRecord(value)) return null;
  return firstString(value, ['name', 'en_name', 'email', 'id']);
}

/** 人员、创建人、修改人：取人员名称，多个用逗号拼接。 */
export function asUser(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return joinLabels(Array.isArray(value) ? value : [value], userLabel);
}

function attachmentLabel(value: unknown): string | null {
  if (typeof value === 'string') return value === '' ? null : value;
  if (!isRecord(value)) return null;
  return firstString(value, ['name', 'file_token']);
}

/** 附件：取文件名，多个用逗号拼接。 */
export function asAttachment(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return joinLabels(Array.isArray(value) ? value : [value], attachmentLabel);
}

function linkIds(value: unknown): string[] {
  if (typeof value === 'string') return value === '' ? [] : [value];
  if (isRecord(value) && Array.isArray(value.link_record_ids)) {
    return value.link_record_ids.filter((id): id is string => typeof id === 'string' && id !== '');
  }
  return [];
}

/** 单向/双向关联：取关联记录 ID，多个用逗号拼接。 */
export function asLink(value: unknown): string | null {
  const values = value === null || value === undefined ? [] : Array.isArray(value) ? value : [value];
  const ids: string[] = [];
  for (const item of values) ids.push(...linkIds(item));
  return ids.length === 0 ? null : ids.join(',');
}

/** 地理位置：优先完整地址，其次地名、详细地址、经纬度。 */
export function asLocation(value: unknown): string | null {
  if (typeof value === 'string') return value === '' ? null : value;
  if (!isRecord(value)) return null;
  return firstString(value, ['full_address', 'name', 'address', 'location']);
}

function groupChatLabel(value: unknown): string | null {
  if (typeof value === 'string') return value === '' ? null : value;
  if (!isRecord(value)) return null;
  return firstString(value, ['name', 'id']);
}

/** 群组：取群组名称，多个用逗号拼接。 */
export function asGroupChat(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return joinLabels(Array.isArray(value) ? value : [value], groupChatLabel);
}

const converters: Record<number, (value: unknown) => FeishuCell> = {
  [FeishuFieldType.Text]: asText,
  [FeishuFieldType.Number]: asNumber,
  [FeishuFieldType.SingleSelect]: asSingleSelect,
  [FeishuFieldType.MultiSelect]: asMultiSelect,
  [FeishuFieldType.DateTime]: asTimestamp,
  [FeishuFieldType.Checkbox]: asCheckbox,
  [FeishuFieldType.User]: asUser,
  [FeishuFieldType.Phone]: asPhone,
  [FeishuFieldType.Url]: asUrl,
  [FeishuFieldType.Attachment]: asAttachment,
  [FeishuFieldType.SingleLink]: asLink,
  [FeishuFieldType.DuplexLink]: asLink,
  [FeishuFieldType.Location]: asLocation,
  [FeishuFieldType.GroupChat]: asGroupChat,
  [FeishuFieldType.CreatedTime]: asTimestamp,
  [FeishuFieldType.ModifiedTime]: asTimestamp,
  [FeishuFieldType.CreatedUser]: asUser,
  [FeishuFieldType.ModifiedUser]: asUser,
  [FeishuFieldType.AutoNumber]: asAutoNumber,
};

const MAX_FORMULA_DEPTH = 5;

/**
 * 公式/查找引用的 value 永远是数组：标量取第一个元素，列表类型保留数组。
 */
function formulaInner(type: number, value: unknown[]): unknown {
  switch (type) {
    case FeishuFieldType.Text:
      return value;
    case FeishuFieldType.MultiSelect:
    case FeishuFieldType.User:
    case FeishuFieldType.Attachment:
    case FeishuFieldType.GroupChat:
      return value.length === 1 && Array.isArray(value[0]) ? value[0] : value;
    case FeishuFieldType.Url:
    case FeishuFieldType.Location:
    case FeishuFieldType.SingleLink:
    case FeishuFieldType.DuplexLink:
      return value.length === 1 ? value[0] : value;
    default:
      return value[0];
  }
}

function convertFormula(value: unknown, depth: number): FeishuCell {
  if (!isRecord(value) || typeof value.type !== 'number' || !Array.isArray(value.value) || value.value.length === 0) {
    return null;
  }
  const innerType = value.type;
  if (innerType === FeishuFieldType.Formula || innerType === FeishuFieldType.Lookup) {
    if (depth >= MAX_FORMULA_DEPTH) return null;
    return convertFormula(value.value[0], depth + 1);
  }
  const converter = converters[innerType];
  return converter ? converter(formulaInner(innerType, value.value)) : null;
}

/** 查找引用/公式：按包内 type 递归转换结果。 */
export function asFormula(value: unknown): FeishuCell {
  return convertFormula(value, 0);
}

export function convertFieldValue(type: number, value: unknown): FeishuCell {
  if (type === FeishuFieldType.Formula || type === FeishuFieldType.Lookup) return asFormula(value);
  const converter = converters[type];
  if (!converter) throw new Error(`Unsupported field type: ${type}`);
  return converter(value);
}

export interface FeishuField {
  name: string;
  type: number;
}

// 一行对象
export function convertRecord(fields: FeishuField[], record: Record<string, unknown>): Record<string, FeishuCell> {
  const row: Record<string, FeishuCell> = {};
  for (const field of fields) {
    const value = record[field.name];
    row[field.name] = convertFieldValue(field.type, value);
  }
  return row;
}
