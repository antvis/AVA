import { describe, expect, it } from 'vitest';

import {
  asAttachment,
  asAutoNumber,
  asFormula,
  asGroupChat,
  asLink,
  asLocation,
  asMultiSelect,
  asNumber,
  asTimestamp,
  asUser,
  convertFieldValue,
  isSupportedFieldType,
} from '../../../src/duckdb/loaders/feishu/convert';

const user = {
  avatar_url: 'https://example.com/avatar.png',
  email: 'amandahuang@example.com',
  en_name: 'Amanda Huang',
  id: 'ou_8240099442cf5da49f04f4bf8f8abcef',
  name: '黄泡泡',
};

describe('asNumber', () => {
  it('keeps numbers and parses numeric strings', () => {
    expect(asNumber(42)).toBe(42);
    expect(asNumber('42.5')).toBe(42.5);
  });

  it('returns null for empty or non-numeric values', () => {
    expect(asNumber(null)).toBeNull();
    expect(asNumber(undefined)).toBeNull();
    expect(asNumber('')).toBeNull();
    expect(asNumber('   ')).toBeNull();
    expect(asNumber('abc')).toBeNull();
  });
});

describe('asTimestamp', () => {
  it('converts millisecond timestamps to ISO strings', () => {
    expect(asTimestamp(1675526400000)).toBe('2023-02-04T16:00:00.000Z');
    expect(asTimestamp('1675526400000')).toBe('2023-02-04T16:00:00.000Z');
    expect(asTimestamp(0)).toBe('1970-01-01T00:00:00.000Z');
  });

  it('returns null for invalid or out-of-range timestamps', () => {
    expect(asTimestamp(null)).toBeNull();
    expect(asTimestamp('')).toBeNull();
    expect(asTimestamp('abc')).toBeNull();
    expect(asTimestamp(8640000000000001)).toBeNull();
  });
});

describe('asMultiSelect', () => {
  it('joins option names with a comma', () => {
    expect(asMultiSelect(['审批集成', '办公管理'])).toBe('审批集成,办公管理');
  });

  it('returns null for empty or non-array values', () => {
    expect(asMultiSelect([])).toBeNull();
    expect(asMultiSelect('审批集成')).toBeNull();
  });
});

describe('asUser', () => {
  it('joins user names with a comma', () => {
    expect(asUser([user])).toBe('黄泡泡');
    expect(asUser([{ name: '张三' }, { en_name: 'Bob' }])).toBe('张三,Bob');
  });

  it('accepts a bare user object and falls back to id', () => {
    expect(asUser(user)).toBe('黄泡泡');
    expect(asUser([{ id: 'ou_2' }])).toBe('ou_2');
  });

  it('skips empty entries', () => {
    expect(asUser([null, {}, { name: '' }])).toBeNull();
    expect(asUser(null)).toBeNull();
  });
});

describe('asAttachment', () => {
  it('joins attachment names with a comma', () => {
    expect(asAttachment([{ name: 'a.png', file_token: 't1' }, { file_token: 't2' }])).toBe('a.png,t2');
  });

  it('returns null for empty values', () => {
    expect(asAttachment([])).toBeNull();
    expect(asAttachment(null)).toBeNull();
  });
});

describe('asLink', () => {
  it('joins record ids with a comma', () => {
    expect(asLink({ link_record_ids: ['rec1', 'rec2'] })).toBe('rec1,rec2');
    expect(asLink([{ link_record_ids: ['rec1'] }, 'rec2'])).toBe('rec1,rec2');
  });

  it('returns null for empty values', () => {
    expect(asLink({ link_record_ids: [] })).toBeNull();
    expect(asLink(null)).toBeNull();
  });
});

describe('asLocation', () => {
  it('prefers the full address and falls back to other labels', () => {
    expect(asLocation({ full_address: '字节跳动，北京市海淀区', name: '字节跳动' })).toBe('字节跳动，北京市海淀区');
    expect(asLocation({ name: '字节跳动' })).toBe('字节跳动');
    expect(asLocation({ location: '116.35,40.01' })).toBe('116.35,40.01');
  });

  it('returns null for empty values', () => {
    expect(asLocation({})).toBeNull();
    expect(asLocation(null)).toBeNull();
  });
});

describe('asGroupChat', () => {
  it('joins group names with a comma', () => {
    expect(asGroupChat([{ name: '测试部门', id: 'oc_1' }, { id: 'oc_2' }])).toBe('测试部门,oc_2');
  });

  it('returns null for empty values', () => {
    expect(asGroupChat([])).toBeNull();
  });
});

describe('asAutoNumber', () => {
  it('accepts the documented string and numeric variants', () => {
    expect(asAutoNumber('1')).toBe('1');
    expect(asAutoNumber(2)).toBe('2');
  });

  it('returns null for empty values', () => {
    expect(asAutoNumber('')).toBeNull();
    expect(asAutoNumber({})).toBeNull();
  });
});

describe('asFormula', () => {
  it('converts text, numeric, date and checkbox results', () => {
    expect(asFormula({ type: 1, ui_type: 'Text', value: [{ text: '✅ 正常', type: 'text' }] })).toBe('✅ 正常');
    expect(asFormula({ type: 2, value: [0.5] })).toBe(0.5);
    expect(asFormula({ type: 2, value: ['0.5'] })).toBe(0.5);
    expect(asFormula({ type: 5, value: [1675526400000] })).toBe('2023-02-04T16:00:00.000Z');
    expect(asFormula({ type: 7, value: [true] })).toBe(true);
  });

  it('converts list-shaped results', () => {
    expect(asFormula({ type: 4, value: [['审批集成', '办公管理']] })).toBe('审批集成,办公管理');
    expect(asFormula({ type: 11, value: [user] })).toBe('黄泡泡');
    expect(asFormula({ type: 17, value: [{ name: 'a.png' }] })).toBe('a.png');
    expect(asFormula({ type: 18, value: [{ link_record_ids: ['rec1', 'rec2'] }] })).toBe('rec1,rec2');
    expect(asFormula({ type: 22, value: [{ full_address: '北京市海淀区' }] })).toBe('北京市海淀区');
    expect(asFormula({ type: 23, value: [{ name: '测试部门' }] })).toBe('测试部门');
  });

  it('unwraps nested formula and lookup wrappers', () => {
    expect(asFormula({ type: 20, value: [{ type: 1, value: [{ text: 'nested', type: 'text' }] }] })).toBe('nested');
    expect(asFormula({ type: 19, value: [{ type: 2, value: [3] }] })).toBe(3);
  });

  it('returns null for empty, malformed or unsupported results', () => {
    expect(asFormula(null)).toBeNull();
    expect(asFormula({ type: 2, value: [] })).toBeNull();
    expect(asFormula({ type: 24, value: ['x'] })).toBeNull();
    expect(asFormula('text')).toBeNull();
  });
});

describe('convertFieldValue', () => {
  it('dispatches the newly supported field types', () => {
    expect(convertFieldValue(11, [user])).toBe('黄泡泡');
    expect(convertFieldValue(17, [{ name: 'a.png' }])).toBe('a.png');
    expect(convertFieldValue(18, { link_record_ids: ['rec1'] })).toBe('rec1');
    expect(convertFieldValue(19, { type: 1, value: [{ text: 'lookup', type: 'text' }] })).toBe('lookup');
    expect(convertFieldValue(20, { type: 2, value: [1] })).toBe(1);
    expect(convertFieldValue(21, { link_record_ids: ['rec1'] })).toBe('rec1');
    expect(convertFieldValue(22, { full_address: '北京市海淀区' })).toBe('北京市海淀区');
    expect(convertFieldValue(23, [{ name: '测试部门' }])).toBe('测试部门');
    expect(convertFieldValue(1003, user)).toBe('黄泡泡');
    expect(convertFieldValue(1004, [user])).toBe('黄泡泡');
  });

  it('rejects unsupported field types', () => {
    expect(() => convertFieldValue(24, 'x')).toThrow('Unsupported field type: 24');
    expect(() => convertFieldValue(3001, true)).toThrow('Unsupported field type: 3001');
  });
});

describe('isSupportedFieldType', () => {
  it('accepts the documented readable field types', () => {
    for (const type of [1, 2, 3, 4, 5, 7, 11, 13, 15, 17, 18, 19, 20, 21, 22, 23, 1001, 1002, 1003, 1004, 1005]) {
      expect(isSupportedFieldType(type), `type ${type}`).toBe(true);
    }
  });

  it('rejects read-only and unknown field types', () => {
    for (const type of [24, 3001, 99]) {
      expect(isSupportedFieldType(type), `type ${type}`).toBe(false);
    }
  });
});
