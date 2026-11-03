import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { loadNotion } from '../../../src/duckdb/loaders/notion';
import { convertPage, supportedFields } from '../../../src/duckdb/loaders/notion/convert';
import { readNotionTable } from '../../../src/duckdb/loaders/notion/read';

vi.mock('../../../src/duckdb/loaders/notion/read', () => ({ readNotionTable: vi.fn() }));

const fields = supportedFields([
  { id: 't', name: '名称', type: 'title', title: {} },
  { id: 'n', name: '金额', type: 'number', number: { format: 'number' } },
  { id: 's', name: '状态', type: 'status', status: { options: [] } },
  { id: 'd', name: '日期', type: 'date', date: {} },
]);

function task(id: string, 名称: string, 金额: number, 状态: string, 日期: string) {
  return {
    id,
    properties: {
      名称: { id: 't', type: 'title', title: [{ type: 'text', plain_text: 名称 }] },
      金额: { id: 'n', type: 'number', number: 金额 },
      状态: { id: 's', type: 'status', status: { name: 状态 } },
      日期: { id: 'd', type: 'date', date: { start: 日期, end: null, time_zone: null } },
    },
  };
}

const rows = [task('r1', '任务A', 120, '已完成', '2026-01-10'), task('r2', '任务B', 80, '进行中', '2026-01-20')].map((p) =>
  convertPage(fields, p)
);

let ava: AVA;
beforeEach(() => {
  ava = new AVA({ llm: { model: 'offline-test' } });
  vi.mocked(readNotionTable).mockResolvedValue({ fields, rows });
});
afterEach(async () => {
  await ava.dispose();
  vi.clearAllMocks();
});

const options = { databaseId: 'db', token: 'test-token' };

describe('Notion AVA / DuckDB integration (offline)', () => {
  it('loads a typed snapshot and verifies two natural-language business examples deterministically', async () => {
    await ava.source({ type: 'notion', options });
    const schema = await ava.schema();
    expect(schema.models[0].columns.map((column) => [column.name, column.type])).toEqual([
      ['_id', 'VARCHAR'],
      ['名称', 'VARCHAR'],
      ['金额', 'DOUBLE'],
      ['状态', 'VARCHAR'],
      ['日期', 'TIMESTAMP WITH TIME ZONE'],
    ]);

    // Example 1: aggregate by status (任务按状态聚合).
    const byStatus = await ava.query(
      'SELECT "状态" AS status, count(*) AS tasks, sum("金额") AS total FROM data GROUP BY status ORDER BY total DESC'
    );
    expect(byStatus.data).toEqual([
      { status: '已完成', tasks: 1, total: 120 },
      { status: '进行中', tasks: 1, total: 80 },
    ]);

    // Example 2: count tasks per month from the date column.
    const byMonth = await ava.query(
      'SELECT strftime("日期" AT TIME ZONE \'UTC\', \'%Y-%m\') AS month, count(*) AS tasks, sum("金额") AS total FROM data GROUP BY month ORDER BY month'
    );
    expect(byMonth.data).toEqual([{ month: '2026-01', tasks: 2, total: 200 }]);
  });

  it('retains empty pages and explicitly typed all-null columns', async () => {
    vi.mocked(readNotionTable).mockResolvedValue({
      fields,
      rows: [convertPage(fields, { id: 'empty', properties: {} })],
    });
    await ava.source({ type: 'notion', options });
    const result = await ava.query('SELECT *, typeof("金额") AS amount_type FROM data');
    expect(result.data).toEqual([
      { _id: 'empty', 名称: null, 金额: null, 状态: null, 日期: null, amount_type: 'DOUBLE' },
    ]);
  });

  it('preserves schema for a zero-page database', async () => {
    vi.mocked(readNotionTable).mockResolvedValue({ fields, rows: [] });
    await ava.source({ type: 'notion', options });
    expect((await ava.query('SELECT * FROM data')).data).toEqual([]);
    expect((await ava.schema()).models[0].columns).toHaveLength(5);
  });

  it('does not whitelist temp directories for analysis and cleans up repeatedly', async () => {
    const source = await loadNotion(options);
    expect(source.allowedDirectories).toEqual([]);
    await source.cleanup();
    await source.cleanup();
  });

  it('releases the failed engine and never exposes a partial dataset', async () => {
    vi.mocked(readNotionTable).mockRejectedValue(new Error('incomplete snapshot'));
    await expect(ava.source({ type: 'notion', options })).rejects.toThrow('incomplete snapshot');
    expect(ava.engine).toBeNull();
  });
});