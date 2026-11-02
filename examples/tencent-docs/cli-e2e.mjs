// Run the real Unix CLI in separate processes: source -> schema -> query ->
// optional model analysis -> dispose. No global `ava` installation is required.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

if (process.platform === 'win32') throw new Error('Run this CLI E2E on Linux/macOS or inside WSL/a Linux container.');
const { TENCENT_DOCS_FILE_ID: fileId, TENCENT_DOCS_SHEET_ID: sheetId } = process.env;
if (!fileId || !sheetId) throw new Error('Set TENCENT_DOCS_FILE_ID and TENCENT_DOCS_SHEET_ID.');
const withModel = process.argv.includes('--with-model');
if (withModel && (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL)) {
  throw new Error('--with-model requires OPENAI_API_KEY and OPENAI_MODEL.');
}

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../../', import.meta.url));
const cli = fileURLToPath(new URL('../../lib/cli/index.js', import.meta.url));
const directory = await mkdtemp(join(tmpdir(), 'ava-tencent-e2e-'));
let datasetId;
let phase = 'source';

async function command(...args) {
  const { stdout } = await exec(process.execPath, [cli, ...args], {
    cwd: root,
    env: process.env,
    timeout: 150000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

const expectedRegions = [
  { region: '华西', orders: 4, sales: 550 },
  { region: '华东', orders: 4, sales: 350 },
];
try {
  const path = join(directory, 'source.json');
  await writeFile(
    path,
    JSON.stringify({ type: 'tencent-smartsheet', options: { fileId, sheetId, pageSize: 2 } }),
    { mode: 0o600 }
  );
  ({ datasetId } = await command('source', `@${path}`));
  assert.match(datasetId, /^ds_/);
  phase = 'schema';
  const schema = await command('schema', datasetId);
  assert.equal(schema.language.fence, 'sql');
  assert.ok(
    schema.models.find((model) => model.name === 'data')?.columns.some((column) => column.name === '_record_id')
  );
  phase = 'query';
  const region = await command(
    'query',
    datasetId,
    '--dsl',
    `SELECT "单选" AS region, count(*) AS orders, sum("数字") AS sales
    FROM data WHERE "文本" LIKE 'AVA-DEMO-%' GROUP BY "单选" ORDER BY sales DESC`
  );
  assert.deepEqual(region.data, expectedRegions);
  console.log('PASS: real CLI source -> schema -> query (pageSize=2).');

  if (withModel) {
    const scope =
      '只统计 data 中 文本 以 AVA-DEMO- 开头的虚构订单。文本是产品，数字是销售额，单选是地区，日期是订单时间；时间按 UTC 计算。';
    phase = 'analyze-regions';
    const regions = await command(
      'analyze',
      datasetId,
      `${scope} 按地区统计订单数和销售额，按销售额从大到小排序。返回列名必须是 region、orders、sales。`,
      '--strategy',
      'direct'
    );
    assert.deepEqual(regions.data, expectedRegions);
    phase = 'analyze-monthly-change';
    const monthly = await command(
      'analyze',
      datasetId,
      `${scope} 比较2026年1月和2月的总销售额，计算2月减1月的变化额和百分比变化（乘100，不附带百分号）。返回一行，列名必须是 jan_sales、feb_sales、change、change_pct。`,
      '--strategy',
      'direct'
    );
    assert.equal(monthly.data.length, 1);
    const row = monthly.data[0];
    assert.equal(Number(row.jan_sales), 500);
    assert.equal(Number(row.feb_sales), 400);
    assert.equal(Number(row.change), -100);
    assert.ok(Math.abs(Number(row.change_pct) + 20) < 1e-6);
    console.log('PASS: two real CLI natural-language analyses match the fixture.');
  }

  phase = 'dispose';
  assert.equal((await command('dispose', datasetId)).disposed, true);
  const disposedId = datasetId;
  datasetId = undefined;
  // The transport may still be completing shutdown when dispose responds.
  // Either a closed socket or an explicit unavailable-dataset response is a rejection.
  await assert.rejects(command('schema', disposedId));
  console.log('PASS: dispose invalidates the real CLI dataset session.');
} catch {
  console.error(`CLI E2E failed during ${phase}. No provider error body or credentials were logged.`);
  process.exitCode = 1;
} finally {
  if (datasetId) await command('dispose', datasetId).catch(() => undefined);
  await rm(directory, { recursive: true, force: true });
}
