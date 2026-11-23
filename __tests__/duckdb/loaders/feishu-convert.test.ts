import { describe, expect, it } from 'vitest';

import {
  asNumber,
  asText,
  castValue,
  cellValues,
  checkTimeZone,
  commonKind,
  defaultKind,
  displayText,
  isSupportedFieldType,
  linkRecordIds,
  wallClock,
} from '../../../src/duckdb/loaders/feishu/convert';

import type { ConvertContext, FeishuField } from '../../../src/duckdb/loaders/feishu/convert';

const ctx: ConvertContext = {
  timeZone: 'Asia/Shanghai',
  linkText: (tableId, id) => (tableId === 'tblCustomers' && id === 'recC1' ? '华东贸易' : id),
};
const field = (type: number, property?: Record<string, unknown>): FeishuField => ({ name: 'f', type, property });
const values = (type: number, value: unknown, property?: Record<string, unknown>) =>
  cellValues(field(type, property), value, ctx);

const user = {
  avatar_url: 'https://example.com/avatar.png',
  email: 'amandahuang@example.com',
  en_name: 'Amanda Huang',
  id: 'ou_8240099442cf5da49f04f4bf8f8abcef',
  name: '黄泡泡',
};

// 2023-02-05 00:00 in Beijing, the documented date example.
const BEIJING_MIDNIGHT = 1675526400000;

describe('wallClock', () => {
  it('reads a timestamp as the wall-clock time of a time zone', () => {
    expect(wallClock(BEIJING_MIDNIGHT, 'Asia/Shanghai')).toBe('2023-02-05 00:00:00.000');
    expect(wallClock(BEIJING_MIDNIGHT, 'UTC')).toBe('2023-02-04 16:00:00.000');
    expect(wallClock(BEIJING_MIDNIGHT + 1234, 'America/New_York')).toBe('2023-02-04 11:00:01.234');
    expect(wallClock(0, 'UTC')).toBe('1970-01-01 00:00:00.000');
  });

  it('returns null outside the representable range', () => {
    expect(wallClock(8640000000000001, 'UTC')).toBeNull();
  });

  it('rejects unknown time zones', () => {
    expect(checkTimeZone('Asia/Shanghai')).toBe('Asia/Shanghai');
    expect(() => checkTimeZone('Mars/Base')).toThrow('Invalid Feishu Bitable time zone: Mars/Base');
  });
});

describe('scalar fields', () => {
  it('joins text segments, including mentions and links', () => {
    const note = [
      { text: '请 ', type: 'text' },
      { text: '@张三', type: 'mention', token: 'ou_1', mentionType: 'User', name: '张三' },
      { text: ' 查看 ', type: 'text' },
      { text: '飞书官网', type: 'url', link: 'https://www.feishu.cn' },
    ];
    expect(values(1, note)).toEqual({ kind: 'text', values: ['请 @张三 查看 飞书官网'] });
    expect(values(1, 'plain')).toEqual({ kind: 'text', values: ['plain'] });
    expect(values(1, [])).toEqual({ kind: 'text', values: [] });
    expect(asText([{ text: '  ', type: 'text' }])).toBeNull();
  });

  it('keeps numbers, parses numeric strings and drops the rest', () => {
    expect(values(2, 42)).toEqual({ kind: 'number', values: [42] });
    expect(values(2, '0.5')).toEqual({ kind: 'number', values: [0.5] });
    expect(values(2, undefined)).toEqual({ kind: 'number', values: [] });
    expect(asNumber('abc')).toBeNull();
    expect(asNumber('  ')).toBeNull();
    expect(asNumber(Number.NaN)).toBeNull();
  });

  it('keeps single select, phone and auto numbers', () => {
    expect(values(3, '进行中')).toEqual({ kind: 'text', values: ['进行中'] });
    expect(values(13, '+86-010-12345678')).toEqual({ kind: 'text', values: ['+86-010-12345678'] });
    expect(values(1005, '17')).toEqual({ kind: 'integer', values: [17] });
    expect(values(1005, 'WO-20240226-0001')).toEqual({ kind: 'text', values: ['WO-20240226-0001'] });
  });

  it('reads an omitted checkbox as unchecked', () => {
    expect(values(7, true)).toEqual({ kind: 'boolean', values: [true] });
    expect(values(7, false)).toEqual({ kind: 'boolean', values: [false] });
    expect(values(7, undefined)).toEqual({ kind: 'boolean', values: [false] });
  });

  it('labels links, locations and attachments', () => {
    expect(values(15, { text: '飞书开放平台', link: 'https://open.feishu.cn' })).toEqual({
      kind: 'text',
      values: ['飞书开放平台'],
    });
    expect(values(15, { link: 'https://open.feishu.cn' }).values).toEqual(['https://open.feishu.cn']);
    expect(
      values(22, { full_address: '北京市海淀区学清路', name: 'Bytedance', location: '116.35,40.01' }).values
    ).toEqual(['北京市海淀区学清路']);
    expect(values(17, [{ name: 'a.png', file_token: 't1' }, { file_token: 't2' }]).values).toEqual(['a.png', 't2']);
  });
});

describe('dates', () => {
  it('uses the date formatter to choose DATE or TIMESTAMP', () => {
    expect(values(5, BEIJING_MIDNIGHT, { date_formatter: 'yyyy/MM/dd' })).toEqual({
      kind: 'date',
      values: ['2023-02-05'],
    });
    expect(values(5, BEIJING_MIDNIGHT + 3600_000, { date_formatter: 'yyyy-MM-dd HH:mm' })).toEqual({
      kind: 'timestamp',
      values: ['2023-02-05 01:00:00.000'],
    });
    expect(defaultKind(field(5, { date_formatter: 'yyyy/MM/dd HH:mm' }))).toBe('timestamp');
    expect(defaultKind(field(5, { date_formatter: 'MM-dd' }))).toBe('date');
  });

  it('keeps the time without a formatter unless it is a local midnight', () => {
    expect(values(5, BEIJING_MIDNIGHT).kind).toBe('date');
    expect(values(5, BEIJING_MIDNIGHT + 60_000).values).toEqual(['2023-02-05 00:01:00.000']);
  });

  it('reads created and modified times as timestamps', () => {
    expect(values(1001, BEIJING_MIDNIGHT, { date_formatter: 'yyyy/MM/dd' })).toEqual({
      kind: 'timestamp',
      values: ['2023-02-05 00:00:00.000'],
    });
    expect(values(1002, 'not a date').values).toEqual([]);
  });
});

describe('list fields', () => {
  it('keeps every option, person and group', () => {
    expect(values(4, ['审批集成', '办公管理'])).toEqual({ kind: 'text', values: ['审批集成', '办公管理'] });
    expect(values(11, [user, { en_name: 'Bob' }, { id: 'ou_2' }, {}]).values).toEqual(['黄泡泡', 'Bob', 'ou_2']);
    expect(values(1003, user).values).toEqual(['黄泡泡']);
    expect(values(23, [{ name: '测试部门', id: 'oc_1' }, { id: 'oc_2' }]).values).toEqual(['测试部门', 'oc_2']);
  });

  it('labels linked records through the context', () => {
    const link = field(21, { table_id: 'tblCustomers', multiple: true });
    expect(cellValues(link, { link_record_ids: ['recC1', 'recC9'] }, ctx).values).toEqual(['华东贸易', 'recC9']);
    expect(linkRecordIds({ link_record_ids: ['rec1', 'rec2'] })).toEqual(['rec1', 'rec2']);
    // Legacy list API shape.
    expect(linkRecordIds([{ record_ids: ['rec1'], table_id: 'tbl1', text: 'a', type: 'text' }])).toEqual(['rec1']);
    expect(linkRecordIds(null)).toEqual([]);
  });
});

describe('formula and lookup', () => {
  it('converts the wrapped result as its own type', () => {
    expect(values(20, { type: 1, ui_type: 'Text', value: [{ text: '✅ 正常', type: 'text' }] })).toEqual({
      kind: 'text',
      values: ['✅ 正常'],
    });
    expect(values(20, { type: 2, ui_type: 'Currency', value: 1250.5 })).toEqual({ kind: 'number', values: [1250.5] });
    expect(values(20, { type: 2, value: ['0.5'] })).toEqual({ kind: 'number', values: [0.5] });
    expect(values(20, { type: 7, value: [true] })).toEqual({ kind: 'boolean', values: [true] });
    expect(values(20, { type: 5, ui_type: 'DateTime', value: BEIJING_MIDNIGHT })).toEqual({
      kind: 'date',
      values: ['2023-02-05'],
    });
  });

  it('keeps one value per referenced record for lookups', () => {
    expect(values(19, { type: 2, value: [3, 5] }).values).toEqual([3, 5]);
    expect(values(19, { type: 4, value: [['审批集成', '办公管理'], ['人事']] }).values).toEqual([
      '审批集成',
      '办公管理',
      '人事',
    ]);
    expect(values(19, { type: 11, value: [user] }).values).toEqual(['黄泡泡']);
    expect(values(19, { type: 3, value: ['上海', '北京'] }).values).toEqual(['上海', '北京']);
  });

  it('unwraps nested formula and lookup wrappers', () => {
    expect(values(20, { type: 20, value: [{ type: 1, value: [{ text: 'nested', type: 'text' }] }] }).values).toEqual([
      'nested',
    ]);
    expect(values(19, { type: 19, value: [{ type: 2, value: [3] }] }).values).toEqual([3]);
  });

  it('returns no values for empty, malformed or unsupported results', () => {
    expect(values(20, null).values).toEqual([]);
    expect(values(20, { type: 2, value: [] }).values).toEqual([]);
    expect(values(20, { type: 24, value: ['x'] }).values).toEqual([]);
    expect(values(20, 'text').values).toEqual([]);
  });
});

describe('column kinds', () => {
  const formula = field(20);

  it('widens mixed formula results', () => {
    const number = { kind: 'number' as const, values: [1.5] };
    const integer = { kind: 'integer' as const, values: [2] };
    const date = { kind: 'date' as const, values: ['2024-01-01'] };
    const timestamp = { kind: 'timestamp' as const, values: ['2024-01-01 08:00:00.000'] };
    const text = { kind: 'text' as const, values: ['x'] };
    const empty = { kind: 'text' as const, values: [] };

    expect(commonKind(formula, [number, integer, empty])).toBe('number');
    expect(commonKind(formula, [date, timestamp])).toBe('timestamp');
    expect(commonKind(formula, [number, text])).toBe('text');
    expect(commonKind(field(2), [empty])).toBe('number');
    expect(castValue('2024-01-01', 'date', 'timestamp')).toBe('2024-01-01 00:00:00.000');
    expect(castValue(1.5, 'number', 'text')).toBe('1.5');
    expect(castValue(2, 'integer', 'number')).toBe(2);
  });

  it('labels a cell with its values', () => {
    expect(displayText({ kind: 'text', values: ['a', 'b'] })).toBe('a, b');
    expect(displayText({ kind: 'number', values: [] })).toBeUndefined();
  });

  it('reads auto numbers with custom rules as text', () => {
    expect(defaultKind(field(1005, { auto_serial: { type: 'custom' } }))).toBe('text');
    expect(defaultKind(field(1005, { auto_serial: { type: 'auto_increment_number' } }))).toBe('integer');
  });
});

describe('isSupportedFieldType', () => {
  it('accepts the documented readable field types', () => {
    for (const type of [1, 2, 3, 4, 5, 7, 11, 13, 15, 17, 18, 19, 20, 21, 22, 23, 1001, 1002, 1003, 1004, 1005]) {
      expect(isSupportedFieldType(type), `type ${type}`).toBe(true);
    }
  });

  it('rejects workflow, button and unknown field types', () => {
    for (const type of [24, 3001, 99]) {
      expect(isSupportedFieldType(type), `type ${type}`).toBe(false);
    }
    expect(() => values(24, 'x')).toThrow('Unsupported field type: 24');
  });
});
