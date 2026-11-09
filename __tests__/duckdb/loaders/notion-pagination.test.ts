import { describe, expect, it, vi } from 'vitest';

import { readPages } from '../../../src/duckdb/loaders/notion/read';

const page = (id: string) => ({ object: 'page', id, properties: {} });

function read(pages: unknown[], maximum = 100) {
  const queryDatabase = vi.fn();
  pages.forEach((p) => queryDatabase.mockResolvedValueOnce(p));
  return { queryDatabase, result: readPages({ queryDatabase }, 'db123', 2, maximum) };
}

describe('Notion pagination integrity', () => {
  it('consumes validated pages before fetching the next without retaining raw pages', async () => {
    const consume = vi.fn();
    const queryDatabase = vi
      .fn()
      .mockResolvedValueOnce({ object: 'list', results: [page('r1')], has_more: true, next_cursor: 'c1' })
      .mockImplementationOnce(async () => {
        expect(consume).toHaveBeenCalledExactlyOnceWith(page('r1'));
        return { object: 'list', results: [page('r2')], has_more: false, next_cursor: null };
      });
    expect(await readPages({ queryDatabase }, 'db123', 2, 100, consume)).toEqual([]);
    expect(consume.mock.calls.map((c) => c[0])).toEqual([page('r1'), page('r2')]);
    expect(queryDatabase.mock.calls.map((c) => c[1].start_cursor)).toEqual([undefined, 'c1']);
  });

  it('follows the next cursor through a short final page', async () => {
    const { result, queryDatabase } = read([
      { object: 'list', results: [page('r1'), page('r2')], has_more: true, next_cursor: 'c2' },
      { object: 'list', results: [page('r3')], has_more: false, next_cursor: null },
    ]);
    expect(await result).toHaveLength(3);
    expect(queryDatabase.mock.calls.map((c) => c[1].start_cursor)).toEqual([undefined, 'c2']);
  });

  it('accepts a genuinely empty database', async () => {
    expect(await read([{ object: 'list', results: [], has_more: false, next_cursor: null }]).result).toEqual([]);
  });

  it.each([
    [{ object: 'list', results: [], has_more: true, next_cursor: 'c' }],
    [{ object: 'list', results: [page('a')], has_more: true, next_cursor: null }],
    [{ object: 'list', results: [page('a')], has_more: false, next_cursor: 'c' }],
    [{ object: 'list', results: [page('a'), page('a')], has_more: false, next_cursor: null }],
    [{ object: 'list', results: [page('a')], has_more: 'false', next_cursor: null }],
    [{ results: [], has_more: false }],
    [{ object: 'not_list', results: [page('a')], has_more: false, next_cursor: null }],
    [
      { object: 'list', results: [page('a')], has_more: true, next_cursor: 'c' },
      { object: 'list', results: [page('a')], has_more: false, next_cursor: null },
    ],
    [
      { object: 'list', results: [page('a')], has_more: true, next_cursor: 'c' },
      { object: 'list', results: [page('b')], has_more: true, next_cursor: 'c2' },
      { object: 'list', results: [], has_more: true, next_cursor: 'c3' },
    ],
  ])('rejects incomplete, repeated or inconsistent pages', async (...pages) => {
    await expect(read(pages).result).rejects.toThrow('Notion');
  });

  it('rejects oversized snapshots before fetching more pages', async () => {
    const { result, queryDatabase } = read(
      [{ object: 'list', results: [page('a')], has_more: true, next_cursor: 'c' }],
      0
    );
    await expect(result).rejects.toThrow('read limit');
    expect(queryDatabase).toHaveBeenCalledTimes(1);
  });
});
