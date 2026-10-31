import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { promisify } from 'util';

import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { sqlserverEnabled, sqlserverOptions } from './test-utils';

const execute = promisify(execFile);
const cliPath = resolve('lib/cli/index.js');

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
});
