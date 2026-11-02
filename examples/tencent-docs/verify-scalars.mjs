// Only reads an explicitly prepared synthetic scalar fixture. Never creates fields/records.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { AVA } from '../../lib/index.js';
import { TencentDocsClient } from '../../lib/duckdb/loaders/tencent/client.js';
import { readPages } from '../../lib/duckdb/loaders/tencent/read.js';

const fixture = JSON.parse(await readFile(new URL('./scalars.json', import.meta.url), 'utf8'));
const { TENCENT_DOCS_FILE_ID: fileId, TENCENT_DOCS_SHEET_ID: sheetId } = process.env;
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 60000);
const client = new TencentDocsClient(controller.signal, 0);
const ava = new AVA({ llm: { model: 'offline-scalar-verification' } });
const quote = (name) => `"${name.replaceAll('"', '""')}"`;
try {
  assert.ok(fileId && sheetId);
  await client.connect({
    clientId: process.env.TENCENT_DOCS_CLIENT_ID || '',
    openId: process.env.TENCENT_DOCS_OPEN_ID || '',
    accessToken: process.env.TENCENT_DOCS_ACCESS_TOKEN || '',
  });
  const fields = await readPages(client, 'getFields', { fileId, sheetId }, 'fields', 2, 1000);
  for (const column of Object.values(fixture.columns)) {
    const field = fields.find((candidate) => candidate.fieldTitle === column.title);
    assert.equal(field?.fieldType, column.fieldType);
  }
  const rawRecords = await readPages(client, 'getRecords', { fileId, sheetId }, 'records', 2, 200);
  const systemTimes = new Map();
  for (const raw of rawRecords) {
    const marker = Array.isArray(raw.values?.['文本']) ? raw.values['文本'].map((item) => item.text).join('') : '';
    if (!fixture.records.some((record) => record.marker === marker)) continue;
    assert.ok(!systemTimes.has(marker));
    assert.ok(typeof raw.createTime === 'string' && /^\d+$/.test(raw.createTime));
    assert.ok(typeof raw.updateTime === 'string' && /^\d+$/.test(raw.updateTime));
    systemTimes.set(marker, { created: Number(raw.createTime), modified: Number(raw.updateTime) });
  }
  assert.equal(systemTimes.size, fixture.records.length);
  console.log('通过：新增标量原生字段类型已核对（每页 2 条）。');

  await ava.source({ type: 'tencent-smartsheet', options: { fileId, sheetId, pageSize: 2 } });
  const schema = (await ava.schema()).models.find((model) => model.name === 'data');
  for (const column of Object.values(fixture.columns)) {
    assert.equal(schema?.columns.find((candidate) => candidate.name === column.title)?.type, column.sqlType);
  }
  const projection = Object.entries(fixture.columns)
    .filter(([alias]) => alias !== 'created' && alias !== 'modified')
    .map(([alias, column]) => `${quote(column.title)} AS ${quote(alias)}`);
  const { created, modified } = fixture.columns;
  const result = await ava.query(`SELECT "文本" AS marker, ${projection.join(', ')},
    epoch_ms(${quote(created.title)}) AS created_ms,
    epoch_ms(${quote(modified.title)}) AS modified_ms
    FROM data WHERE "文本" IN ('AVA-TYPE-01', 'AVA-TYPE-02') ORDER BY "文本"`);
  assert.equal(result.data.length, fixture.records.length);
  const earliest = Date.parse('2020-01-01T00:00:00Z');
  const latest = Date.now() + 24 * 60 * 60 * 1000;
  for (const [index, row] of result.data.entries()) {
    const { created_ms: createdMs, modified_ms: modifiedMs, ...values } = row;
    assert.deepEqual(values, fixture.records[index]);
    assert.equal(createdMs, systemTimes.get(values.marker)?.created);
    assert.equal(modifiedMs, systemTimes.get(values.marker)?.modified);
    assert.ok(Number.isSafeInteger(createdMs) && createdMs >= earliest && createdMs <= latest);
    assert.ok(Number.isSafeInteger(modifiedMs) && modifiedMs >= createdMs && modifiedMs <= latest);
  }
  console.log('通过：正式 loader/DuckDB 的布尔、原始进度、前导零字符串及系统时间断言。');
} catch {
  console.error(
    '新增标量验证未通过：请检查显式原生 ID、授权、6 个字段的实际类型和两条手工准备的虚构记录。未打印平台错误正文或源数据。'
  );
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
  await client.close().catch(() => undefined);
  await ava.dispose();
}
