import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { promisify } from 'util';

import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { AVA } from '../../../src';
import { getLLMConfig, skipLLMTests } from '../../test-utils';

import { sqlserverEnabled, sqlserverOptions } from './test-utils';

const execute = promisify(execFile);
const cliPath = resolve('lib/cli/index.js');
const monthlyQuestion = "按月份汇总 dbo.orders 中 status='paid' 的金额。输出 month（YYYY-MM字符串）和 total_amount，按月份升序。";
const customersQuestion = "按 dbo.customers 的 customer_id 升序，关联 dbo.orders 计算每个客户 status='paid' 的总金额；保留没有已支付订单的客户并用0表示。输出 customer_id、customer_name、total_amount。";
const monthlyExpected = [{ month: '2025-01', total_amount: 450.75 }, { month: '2025-02', total_amount: 380 }];
const customersExpected = [
  { customer_id: 1, customer_name: '张三', total_amount: 380.5 },
  { customer_id: 2, customer_name: 'Alice', total_amount: 450.25 },
  { customer_id: 3, customer_name: '李四', total_amount: 0 },
];

async function cli(args: string[]): Promise<any> {
  const { stdout } = await execute(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(), env: process.env, timeout: 90000, maxBuffer: 2 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

describe.skipIf(!sqlserverEnabled)('SQL Server actual CLI sessions', () => {
  const directories: string[] = [];
  const datasets = new Set<string>();

  beforeAll(() => {
    expect(existsSync(cliPath), 'Run npm run build before enabling SQL Server CLI integration tests').toBe(true);
  });

  afterEach(async () => {
    for (const dataset of datasets) {
      await cli(['dispose', dataset]);
      datasets.delete(dataset);
    }
    await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
  });

  async function source() {
    const directory = await mkdtemp(join(tmpdir(), 'ava-sqlserver-e2e-'));
    directories.push(directory);
    const file = join(directory, 'source.json');
    await writeFile(file, JSON.stringify({ type: 'sqlserver', options: { ...sqlserverOptions(), schema: 'dbo' } }), { mode: 0o600 });
    const { datasetId } = await cli(['source', `@${file}`]);
    datasets.add(datasetId);
    return datasetId as string;
  }

  it('automatically routes source, schema, native queries and disposal through the remote engine', async () => {
    const id = await source();
    const schema = await cli(['schema', id]);
    expect(schema.language.name).toContain('SQL Server');
    expect(schema.models.map((model: { name: string }) => model.name)).toContain('[dbo].[orders]');
    const profile = await cli(['profile', id, '--metrics', 'row_count,mean']);
    const orders = profile.models.find((model: { name: string }) => model.name === '[dbo].[orders]');
    expect(orders.metrics).toEqual({ row_count: 6 });
    expect(orders.columns.find((column: { name: string }) => column.name === 'amount').metrics.mean).toBeCloseTo(
      881.5 / 6
    );
    const total = await cli(['query', id, '--dsl', 'SELECT COUNT(*) AS count, SUM(amount) AS total FROM dbo.orders']);
    expect(total.data).toEqual([{ count: 6, total: 881.5 }]);
    await cli(['dispose', id]);
    datasets.delete(id);
    await expect(cli(['schema', id])).rejects.toThrow();
  }, 30000);

  it.skipIf(skipLLMTests)('analyzes both fixed natural-language examples through the actual CLI', async () => {
    const id = await source();
    const monthly = await cli(['analyze', id, monthlyQuestion, '--strategy', 'direct']);
    expect(monthly.data).toEqual(monthlyExpected);
    expect(monthly.text.trim().length).toBeGreaterThan(0);
    const customers = await cli(['analyze', id, customersQuestion, '--strategy', 'direct']);
    expect(customers.data).toEqual(customersExpected);
    expect(customers.text.trim().length).toBeGreaterThan(0);
  }, 180000);
});

describe.skipIf(!sqlserverEnabled || skipLLMTests)('SQL Server SDK natural-language analysis', () => {
  let ava: AVA | undefined;

  afterEach(async () => {
    await ava?.dispose();
    ava = undefined;
  });

  async function source() {
    ava = new AVA({ llm: getLLMConfig(), engine: { type: 'sqlserver' } });
    await ava.source({ type: 'sqlserver', options: { ...sqlserverOptions(), schema: 'dbo' } });
    return ava;
  }

  it('analyzes both examples with exact expected results', async () => {
    const instance = await source();
    const monthly = await instance.analyze(monthlyQuestion, { strategy: { type: 'direct' } });
    expect(monthly.data).toEqual(monthlyExpected);
    expect(monthly.text.trim().length).toBeGreaterThan(0);
    const customers = await instance.analyze(customersQuestion, { includeSummary: false, strategy: { type: 'direct' } });
    expect(customers.data).toEqual(customersExpected);
  }, 180000);

});
