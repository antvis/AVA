import { describe, expect, it, vi } from 'vitest';

import { readPages } from '../../../src/duckdb/loaders/tencent/read';

const args = { file_id: 'file', sheet_id: 'sheet' };
const row = (record_id: string) => ({ record_id, field_values: [] });

function read(pages: unknown[], maximum = 100) {
  const call = vi.fn();
  pages.forEach((page) => call.mockResolvedValueOnce(page));
  return { call, result: readPages({ call }, 'smartsheet.list_records', args, 'records', 2, maximum) };
}

describe('Tencent Docs pagination integrity', () => {
  it('consumes validated records before fetching the next page without retaining raw records', async () => {
    const consume = vi.fn();
    const call = vi
      .fn()
      .mockResolvedValueOnce({ records: [row('r1')], total: 2, has_more: true, next: 1 })
      .mockImplementationOnce(async () => {
        expect(consume).toHaveBeenCalledExactlyOnceWith(row('r1'));
        return { records: [row('r2')], total: 2, has_more: false, next: 0 };
      });
    expect(await readPages({ call }, 'smartsheet.list_records', args, 'records', 2, 100, consume)).toEqual([]);
    expect(consume.mock.calls.map((call) => call[0])).toEqual([row('r1'), row('r2')]);
  });

  it('follows the explicit next offset through a short final page', async () => {
    const { call, result } = read([
      { records: [row('r1'), row('r2')], total: 3, has_more: true, next: 2 },
      { records: [row('r3')], total: 3, has_more: false, next: 0 },
    ]);
    expect(await result).toHaveLength(3);
    expect(call.mock.calls.map((c) => c[1].offset)).toEqual([0, 2]);
  });

  it('accepts a genuinely empty table', async () => {
    expect(await read([{ records: [], total: 0, has_more: false }]).result).toEqual([]);
  });

  it.each([
    [{ records: [row('a')], total: 2, has_more: false }],
    [{ records: [], total: 2, has_more: true, next: 0 }],
    [{ records: [row('a')], total: 2, has_more: true, next: 0 }],
    [{ records: [row('a')], total: 2, has_more: true, next: 2 }],
    [{ records: [row('a')], total: 0, has_more: false }],
    [{ records: [row('a')], has_more: false }],
    [{ records: [row('a')], total: 1, has_more: 'false' }],
    [{ records: [row('a'), row('a')], total: 2, has_more: false }],
    [{ records: [row('a'), row('b'), row('c')], total: 3, has_more: false }],
    [
      { records: [row('a')], total: 2, has_more: true, next: 1 },
      { records: [row('a')], total: 2, has_more: false },
    ],
    [
      { records: [row('a')], total: 2, has_more: true, next: 1 },
      { records: [row('b')], total: 3, has_more: false },
    ],
  ])('rejects incomplete, repeated or inconsistent pages', async (...pages) => {
    await expect(read(pages).result).rejects.toThrow('Tencent Docs');
  });

  it('rejects oversized snapshots before fetching more pages', async () => {
    const { result, call } = read([{ records: [row('a')], total: 3, has_more: true, next: 1 }], 2);
    await expect(result).rejects.toThrow('read limit');
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('applies the same pagination checks to fields', async () => {
    const call = vi.fn().mockResolvedValue({ fields: [{ field_id: 'f1' }], total: 1, has_more: false });
    expect(await readPages({ call }, 'smartsheet.list_fields', args, 'fields', 100, 1000)).toHaveLength(1);
  });
});
