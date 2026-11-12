import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { run } from '../src/cli';

describe('foreground CSV commands', () => {
  let directory: string;
  let csv: string;
  let semantic: string;
  let dsl: string;
  const input = [
    'product,region,status,amount',
    ...Array.from({ length: 24 }, (_, i) => `SKU${i + 1},${i < 12 ? 'east' : 'west'},paid,${i + 1}`),
    'cancelled order,east,cancelled,999',
  ].join('\n');
  const total = "SELECT sum(amount)::INTEGER AS gmv FROM data WHERE status = 'paid'";

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ava-local-'));
    csv = join(directory, '销售 明细.csv');
    semantic = join(directory, '销售 口径.json');
    dsl = join(directory, 'GMV total.sql');
    await Promise.all([
      writeFile(csv, input),
      writeFile(semantic, JSON.stringify({ description: 'GMV only includes paid orders.' })),
      writeFile(dsl, total),
    ]);
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  async function execute(args: string[]) {
    let output = '';
    await run(args, (value) => {
      output = value;
    });
    return JSON.parse(output);
  }

  it('discovers schema and runs reproducible sales summaries with optional Semantic', async () => {
    expect(await execute(['schema', '--local', csv])).toMatchObject({
      language: 'duckdb-sql',
      models: [{ name: 'data', columns: ['product', 'region', 'status', 'amount'].map((name) => ({ name })) }],
    });
    const query = ['query', '--local', csv, '--dsl', `@${dsl}`, '--semantic-file', semantic];
    for (let i = 0; i < 2; i++) {
      expect(await execute(query)).toMatchObject({ semanticLoaded: true, data: [{ gmv: 300 }], rowCount: 1 });
    }
    expect(
      await execute(['query', '--local', csv, '--dsl', 'SELECT sum(amount)::INTEGER AS gmv FROM data'])
    ).toMatchObject({
      data: [{ gmv: 1299 }],
    });
    const regions = `${total.replace('SELECT ', 'SELECT region, ')} GROUP BY region ORDER BY region`;
    expect(await execute(['query', '--local', csv, '--dsl', regions])).toMatchObject({
      data: [
        { region: 'east', gmv: 78 },
        { region: 'west', gmv: 222 },
      ],
    });
    expect(await readFile(csv, 'utf8')).toBe(input);
  });

  it('distinguishes a SQL Top 20 from a truncated result', async () => {
    const ranking =
      "SELECT product, sum(amount)::INTEGER AS gmv FROM data WHERE status = 'paid' GROUP BY product ORDER BY gmv DESC";
    const top20 = await execute(['query', '--local', csv, '--dsl', `${ranking} LIMIT 20`]);
    expect(top20).toMatchObject({ rowCount: 20 });
    expect(top20.truncated).toBeUndefined();
    expect(top20.data.at(0)).toEqual({ product: 'SKU24', gmv: 24 });
    expect(top20.data.at(-1)).toEqual({ product: 'SKU5', gmv: 5 });

    const truncated = await execute(['query', '--local', csv, '--dsl', ranking, '--max-rows', '20']);
    expect(truncated).toMatchObject({ truncated: true, truncatedBy: 'maxRows', data: top20.data });
    expect(truncated.rowCount).toBeUndefined();
  });

  it('rejects invalid Semantic and keeps local queries read-only', async () => {
    await writeFile(semantic, '{"models":null}');
    await expect(run(['query', '--local', csv, '--dsl', `@${dsl}`, '--semantic-file', semantic])).rejects.toThrow(
      /models/
    );
    await expect(run(['query', '--local', csv, '--dsl', 'DROP VIEW data'])).rejects.toThrow(/read-only SELECT/);
  });
});
