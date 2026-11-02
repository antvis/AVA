import { describe, expect, it, vi } from 'vitest';

import { readPages } from '../../../src/duckdb/loaders/tencent/read';

const args = { fileId: 'file', sheetId: 'sheet' };
const row = (recordID: string) => ({ recordID, values: {} });

function read(pages: unknown[], maximum = 100) {
  const call = vi.fn();
  pages.forEach((page) => call.mockResolvedValueOnce(page));
  return { call, result: readPages({ call }, 'getRecords', args, 'records', 2, maximum) };
}

describe('Tencent Docs pagination integrity', () => {
  it('consumes validated records before fetching the next page without retaining raw records', async () => {
    const consume = vi.fn();
    const call = vi
      .fn()
      .mockResolvedValueOnce({ records: [row('r1')], total: 2, hasMore: true, next: 1 })
      .mockImplementationOnce(async () => {
        expect(consume).toHaveBeenCalledExactlyOnceWith(row('r1'));
        return { records: [row('r2')], total: 2, hasMore: false, next: 0 };
      });
    expect(await readPages({ call }, 'getRecords', args, 'records', 2, 100, consume)).toEqual([]);
    expect(consume.mock.calls.map((call) => call[0])).toEqual([row('r1'), row('r2')]);
  });

  it('follows the explicit next offset through a short final page', async () => {
    const { call, result } = read([
      { records: [row('r1'), row('r2')], total: 3, hasMore: true, next: 2 },
      { records: [row('r3')], total: 3, hasMore: false, next: 0 },
    ]);
    expect(await result).toHaveLength(3);
    expect(call.mock.calls.map((c) => c[1].offset)).toEqual([0, 2]);
  });

  it('accepts a genuinely empty table', async () => {
    expect(await read([{ records: [], total: 0, hasMore: false }]).result).toEqual([]);
  });

  it.each([
    [{ records: [row('a')], total: 2, hasMore: false }],
    [{ records: [], total: 2, hasMore: true, next: 0 }],
    [{ records: [row('a')], total: 2, hasMore: true, next: 0 }],
    [{ records: [row('a')], total: 2, hasMore: true, next: 2 }],
    [{ records: [row('a')], total: 0, hasMore: false }],
    [{ records: [row('a')], hasMore: false }],
    [{ records: [row('a')], total: 1, hasMore: 'false' }],
    [{ records: [row('a'), row('a')], total: 2, hasMore: false }],
    [{ records: [row('a'), row('b'), row('c')], total: 3, hasMore: false }],
    [
      { records: [row('a')], total: 2, hasMore: true, next: 1 },
      { records: [row('a')], total: 2, hasMore: false },
    ],
    [
      { records: [row('a')], total: 2, hasMore: true, next: 1 },
      { records: [row('b')], total: 3, hasMore: false },
    ],
  ])('rejects incomplete, repeated or inconsistent pages', async (...pages) => {
    await expect(read(pages).result).rejects.toThrow('Tencent Docs');
  });

  it('rejects oversized snapshots before fetching more pages', async () => {
    const { result, call } = read([{ records: [row('a')], total: 3, hasMore: true, next: 1 }], 2);
    await expect(result).rejects.toThrow('read limit');
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('rejects cumulative page bytes over 16 MiB instead of returning a truncated snapshot', async () => {
    const payload = 'x'.repeat(8 * 1024 * 1024);
    const { result, call } = read([
      { records: [{ recordID: 'a', values: { payload } }], total: 2, hasMore: true, next: 1 },
      { records: [{ recordID: 'b', values: { payload } }], total: 2, hasMore: false },
    ]);
    await expect(result).rejects.toThrow('16 MiB');
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('applies the same pagination checks to fields', async () => {
    const call = vi.fn().mockResolvedValue({ fields: [{ fieldID: 'f1' }], total: 1, hasMore: false });
    expect(await readPages({ call }, 'getFields', args, 'fields', 100, 1000)).toHaveLength(1);
  });
});
