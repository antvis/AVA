// Read-only verification of an explicitly prepared synthetic fixture.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AVA } from '../../lib/index.js';
import { TencentDocsClient } from '../../lib/duckdb/loaders/tencent/client.js';
import { readPages } from '../../lib/duckdb/loaders/tencent/read.js';

const fixture = JSON.parse(await readFile(new URL('./money.json', import.meta.url), 'utf8'));
const { TENCENT_DOCS_FILE_ID: fileId, TENCENT_DOCS_SHEET_ID: sheetId } = process.env;
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 60000);
const client = new TencentDocsClient(controller.signal, 0);
const ava = new AVA({ llm: { model: 'offline-money-verification' } });
const quote = (name) => '"' + name.replaceAll('"', '""') + '"';
try {
  assert.ok(fileId && sheetId);
  await client.connect({
    clientId: process.env.TENCENT_DOCS_CLIENT_ID || '',
    openId: process.env.TENCENT_DOCS_OPEN_ID || '',
    accessToken: process.env.TENCENT_DOCS_ACCESS_TOKEN || '',
  });
  const fields = await readPages(client, 'getFields', { fileId, sheetId }, 'fields', 2, 1000);
  for (const column of Object.values(fixture.columns)) {
    assert.equal(fields.find((field) => field.fieldTitle === column.title)?.fieldType, column.fieldType);
  }
  const source = await readPages(client, 'getRecords', { fileId, sheetId }, 'records', 2, 200);
  const markers = new Map(fixture.records.map((row) => [row.marker, row]));
  const seen = new Set();
  for (const row of source) {
    const marker = (row.values?.['文本'] || []).map((item) => item.text).join('');
    if (!markers.has(marker)) continue;
    assert.ok(!seen.has(marker));
    seen.add(marker);
    for (const [alias, column] of Object.entries(fixture.columns)) {
      assert.equal(typeof row.values[column.title], 'number');
      assert.equal(row.values[column.title], markers.get(marker)[alias]);
    }
  }
  assert.equal(seen.size, fixture.records.length);
  console.log('通过：OpenAPI 独立类型 26/28 及零值、正负数、原始比例（每页 2 条）。');
  await ava.source({ type: 'tencent-smartsheet', options: { fileId, sheetId, pageSize: 2 } });
  const model = (await ava.schema()).models.find((model) => model.name === 'data');
  for (const column of Object.values(fixture.columns)) {
    assert.equal(model?.columns.find((candidate) => candidate.name === column.title)?.type, column.sqlType);
  }
  const { currency, percentage } = fixture.columns;
  const result = await ava.query(
    'SELECT "文本" AS marker, ' +
      quote(currency.title) +
      ' AS currency, ' +
      quote(percentage.title) +
      ' AS percentage FROM data WHERE "文本" IN ' +
      "('AVA-MONEY-ZERO','AVA-MONEY-POSITIVE','AVA-MONEY-NEGATIVE')"
  );
  assert.equal(result.data.length, fixture.records.length);
  for (const row of result.data) assert.deepEqual(row, markers.get(row.marker));
  const totals = (
    await ava.query(
      'SELECT SUM(' +
        quote(currency.title) +
        ') AS amount, SUM(' +
        quote(percentage.title) +
        ') AS ratio FROM data WHERE "文本" LIKE \'AVA-MONEY-%\''
    )
  ).data[0];
  assert.ok(Math.abs(totals.amount - 1222.22) < 1e-9);
  assert.equal(totals.ratio, -0.125);
  console.log('通过：正式 loader/DuckDB 两列 DOUBLE、全部夹具值和数值聚合；不做百分比倍率变换。');
} catch {
  console.error('货币/百分比只读验证失败：检查原生 ID、授权及专用夹具；未打印凭证、源记录或平台正文。');
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
  await client.close().catch(() => undefined);
  await ava.dispose();
}
