import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';
import { loadTencentDocs } from '../../../src/duckdb/loaders/tencent-docs-smartsheet';
import { convertRecord, supportedFields } from '../../../src/duckdb/loaders/tencent/convert';
import { readTencentTable } from '../../../src/duckdb/loaders/tencent/read';
import sales from '../../../examples/tencent-docs/sales.json';

vi.mock('../../../src/duckdb/loaders/tencent/read', () => ({ readTencentTable: vi.fn() }));

const fields = supportedFields([
  { field_id: 'f1', field_title: '文本', field_type: 'text' },
  { field_id: 'f2', field_title: '数字', field_type: 'number' },
  { field_id: 'f3', field_title: '单选', field_type: 'singleSelect' },
  { field_id: 'f4', field_title: '日期', field_type: 'dateTime' },
]);
const rows = sales.map((sale, i) =>
  convertRecord(fields, {
    record_id: `r${i}`,
    field_values: [
      { field: '文本', text_value: { items: [{ text: sale.文本, type: 'text' }] } },
      { field: '数字', number_value: sale.数字 },
      { field: '单选', option_value: { items: [{ text: sale.单选 }] } },
      { field: '日期', string_value: String(Date.parse(sale.日期)) },
    ],
  })
);

let ava: AVA;
beforeEach(() => {
  ava = new AVA({ llm: { model: 'offline-test' } });
  vi.mocked(readTencentTable).mockResolvedValue({ fields, rows });
});
afterEach(async () => {
  await ava.dispose();
  vi.clearAllMocks();
});

const options = { fileId: 'file', sheetId: 'sheet', token: 'test-token' };

describe('Tencent Docs AVA / DuckDB integration (offline)', () => {
  it('loads a typed snapshot and verifies the two business examples independently of an LLM', async () => {
    await ava.source({ type: 'tencent-docs-smartsheet', options });
    const schema = await ava.schema();
    expect(schema.models[0].columns.map((column) => [column.name, column.type])).toEqual([
      ['_record_id', 'VARCHAR'],
      ['文本', 'VARCHAR'],
      ['数字', 'DOUBLE'],
      ['单选', 'VARCHAR'],
      ['日期', 'TIMESTAMP WITH TIME ZONE'],
    ]);
    const region = await ava.query(
      'SELECT "单选" AS region, count(*) AS orders, sum("数字") AS sales FROM data GROUP BY "单选" ORDER BY sales DESC'
    );
    expect(region.data).toEqual([
      { region: '华西', orders: 4, sales: 550 },
      { region: '华东', orders: 4, sales: 350 },
    ]);
    const months = await ava.query(
      'SELECT strftime("日期" AT TIME ZONE \'UTC\', \'%Y-%m\') AS month, sum("数字") AS sales FROM data GROUP BY month ORDER BY month'
    );
    expect(months.data).toEqual([
      { month: '2026-01', sales: 500 },
      { month: '2026-02', sales: 400 },
    ]);
    expect((400 - 500) / 500).toBe(-0.2);
  });

  it('retains empty records and explicitly typed all-null columns', async () => {
    vi.mocked(readTencentTable).mockResolvedValue({
      fields,
      rows: [convertRecord(fields, { record_id: 'empty', field_values: [] })],
    });
    await ava.source({ type: 'tencent-docs-smartsheet', options });
    const result = await ava.query('SELECT *, typeof("数字") AS number_type FROM data');
    expect(result.data).toEqual([
      { _record_id: 'empty', 文本: null, 数字: null, 单选: null, 日期: null, number_type: 'DOUBLE' },
    ]);
  });

  it('preserves schema for a zero-record table', async () => {
    vi.mocked(readTencentTable).mockResolvedValue({ fields, rows: [] });
    await ava.source({ type: 'tencent-docs-smartsheet', options });
    expect((await ava.query('SELECT * FROM data')).data).toEqual([]);
    expect((await ava.schema()).models[0].columns).toHaveLength(5);
  });

  it('does not whitelist temp directories for analysis and cleans up repeatedly', async () => {
    const source = await loadTencentDocs(options);
    expect(source.allowedDirectories).toEqual([]);
    await source.cleanup();
    await source.cleanup();
  });

  it('releases the failed engine and never exposes a partial dataset', async () => {
    vi.mocked(readTencentTable).mockRejectedValue(new Error('incomplete snapshot'));
    await expect(ava.source({ type: 'tencent-docs-smartsheet', options })).rejects.toThrow('incomplete snapshot');
    expect(ava.engine).toBeNull();
  });
});
