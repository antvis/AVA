import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { run as viz } from '../src/cli/commands/viz';
import { recordQuery, renderReport } from '../skills/ava/scripts/report.mjs';

let directory: string;
let specPath: string;
let spec: any;

const invoke = async (args: string[], input: string) => {
  expect(args).toEqual(['viz', '--spec', '-']);
  return viz([], { spec: input });
};

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'ava-report-'));
  const sql = join(directory, 'query.sql');
  await writeFile(sql, 'SELECT city, revenue FROM data');
  const { queryId } = await recordQuery(
    { evidence: directory, datasetId: 'test', dsl: sql, source: 'sales.csv' },
    async () => ({
      schema: [{ name: 'city' }, { name: 'revenue' }],
      data: [{ city: 'Hangzhou', revenue: 100 }],
    })
  );
  spec = {
    title: 'Sales report',
    summary: 'Revenue by city',
    sections: [
      {
        id: 'revenue',
        question: 'Revenue by city?',
        conclusion: 'Hangzhou: 100',
        queryId,
        chartFields: { category: 'city', value: 'revenue' },
        chart: { chartType: 'column', config: { title: '</body></script><script>alert(1)</script> $&' } },
      },
    ],
  };
  specPath = join(directory, 'spec.json');
  await writeFile(specPath, JSON.stringify(spec));
});

afterEach(async () => rm(directory, { recursive: true, force: true }));

describe('report chart configs', () => {
  it('embeds validated configs without nested documents and preserves script escaping', async () => {
    const result = await renderReport(
      { evidence: directory, spec: specPath, output: join(directory, 'report.html') },
      invoke
    );
    const html = await readFile(result.output, 'utf8');
    const payload = JSON.parse(await readFile(result.dataOutput, 'utf8'));
    expect(result.chartCount).toBe(1);
    expect(result.chartErrors).toEqual([]);
    expect(payload.charts).toEqual([
      {
        section: 1,
        config: {
          type: 'column',
          title: spec.sections[0].chart.config.title,
          data: [{ category: 'Hangzhou', value: 100 }],
        },
      },
    ]);
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('srcdoc');
    expect(html.match(/<\/body/g)).toHaveLength(1);
    const embedded = html.match(/<script id="artifact-data" type="application\/json">([\s\S]*?)<\/script>/)![1];
    expect(embedded).not.toContain('<');
    expect(JSON.parse(embedded)).toEqual(payload);
  });

  it('retains CLI validation failures and the query data', async () => {
    spec.sections[0].chart.config.type = 'pie';
    await writeFile(specPath, JSON.stringify(spec));
    const result = await renderReport(
      { evidence: directory, spec: specPath, output: join(directory, 'invalid.html') },
      invoke
    );
    expect(result.chartCount).toBe(0);
    expect(result.chartErrors).toMatchObject([{ section: 1, message: expect.any(String) }]);
    const payload = JSON.parse(await readFile(result.dataOutput, 'utf8'));
    expect(payload.queries[0].result.data).toEqual([{ city: 'Hangzhou', revenue: 100 }]);
  });

  it('regenerates an older HTML-based report from its saved evidence', async () => {
    const first = await renderReport(
      { evidence: directory, spec: specPath, output: join(directory, 'first.html') },
      invoke
    );
    const previous = JSON.parse(await readFile(first.dataOutput, 'utf8'));
    previous.charts = [{ section: 1, html: '<html><body>old chart</body></html>' }];
    await writeFile(first.dataOutput, JSON.stringify(previous));
    await writeFile(specPath, JSON.stringify({ title: 'Updated report' }));
    const result = await renderReport(
      { previous: first.dataOutput, spec: specPath, output: join(directory, 'updated.html') },
      invoke
    );
    const payload = JSON.parse(await readFile(result.dataOutput, 'utf8'));
    expect(payload.title).toBe('Updated report');
    expect(payload.charts[0].config.type).toBe('column');
    expect(payload.charts[0]).not.toHaveProperty('html');
    expect(payload.queries).toEqual(previous.queries);
  });
});
