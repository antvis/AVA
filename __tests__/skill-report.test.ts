import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { queryIndex, recordQuery, renderReport } from '../skills/ava/scripts/report.mjs';

let directory: string;
let evidence: string;
let dsl: string;
const result = {
  schema: [{ name: 'month' }, { name: 'revenue' }],
  data: [{ month: 'Jan', revenue: 120 }],
  rowCount: 1,
};

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'ava-skill-report-'));
  evidence = join(directory, 'evidence');
  dsl = join(directory, 'query.sql');
  await writeFile(dsl, 'SELECT month, SUM(amount) AS revenue FROM data GROUP BY month');
});
afterEach(async () => rm(directory, { recursive: true, force: true }));

async function query(data = result) {
  return recordQuery({ evidence, datasetId: 'ds_test', dsl, source: 'sales.csv' }, async () => data);
}
async function spec(value, name = 'spec.json') {
  const path = join(directory, name);
  await writeFile(path, JSON.stringify(value));
  return path;
}
function section(queryId, id = 'monthly') {
  return {
    id,
    question: 'Monthly revenue?',
    conclusion: 'January revenue is 120 CNY.',
    queryId,
    chartFields: { time: 'month', value: 'revenue' },
    chart: { chartType: 'line', config: {} },
  };
}
const renderChart = async (args, input) => {
  expect(args[0]).toBe('viz');
  await writeFile(args.at(-1), `<html>${input}</html>`);
  return { output: args.at(-1) };
};

describe('AVA skill report evidence and revisions', () => {
  it('records exact execution, indexes private immutable evidence, and detects changes', async () => {
    const invoke = vi.fn(async () => result);
    const saved = await recordQuery({ evidence, datasetId: 'ds_test', dsl, source: 'sales.csv', maxRows: 10 }, invoke);
    expect(invoke).toHaveBeenCalledOnce();
    expect(invoke.mock.calls[0]).toEqual([
      ['query', 'ds_test', '--dsl', '-', '--max-rows', '10'],
      await readFile(dsl, 'utf8'),
    ]);
    expect((await stat(saved.evidenceOutput)).mode & 0o777).toBe(0o600);
    expect((await queryIndex(evidence))[0].result).toEqual(result);
    const changed = JSON.parse(await readFile(saved.evidenceOutput, 'utf8'));
    changed.result.data[0].revenue = 999;
    await writeFile(saved.evidenceOutput, JSON.stringify(changed));
    await expect(queryIndex(evidence)).rejects.toThrow(/changed/);
  });

  it('creates a portable report and updates it using prior evidence without rerunning queries', async () => {
    const saved = await query();
    const first = await renderReport(
      {
        evidence,
        output: join(directory, 'v1.html'),
        spec: await spec({
          title: 'Sales',
          summary: 'Revenue is 120 CNY.',
          sections: [section(saved.queryId)],
        }),
      },
      renderChart
    );
    const html = await readFile(first.output, 'utf8');
    expect(html).toContain('data:image/svg+xml;base64,');
    expect(first.chartCount).toBe(1);
    const before = await readFile(first.dataOutput, 'utf8');
    await rm(evidence, { recursive: true });
    const next = await renderReport(
      {
        previous: first.dataOutput,
        output: join(directory, 'v2.html'),
        spec: await spec(
          {
            summary: 'Follow-up keeps the original evidence.',
            sections: [{ ...section(saved.queryId, 'follow-up'), chart: undefined, chartFields: undefined }],
          },
          'patch.json'
        ),
      },
      renderChart
    );
    const report = JSON.parse(await readFile(next.dataOutput, 'utf8'));
    expect(report.sections.map((item) => item.id)).toEqual(['monthly', 'follow-up']);
    expect(report.queries).toHaveLength(1);
    expect(report.previousReport).toBe('v1.json');
    expect(await readFile(first.dataOutput, 'utf8')).toBe(before);
    expect((await stat(next.output)).mode & 0o777).toBe(0o600);
  });

  it('replaces a section by stable id while retaining other sections and precise metrics', async () => {
    const saved = await query({ ...result, data: [{ month: 'Jan', revenue: '9007199254740993' }] });
    const original = { ...section(saved.queryId), chart: undefined, chartFields: undefined };
    const first = await renderReport(
      {
        evidence,
        output: join(directory, 'v1.html'),
        spec: await spec({
          title: 'Sales',
          summary: 'Precise revenue.',
          sections: [original, { ...original, id: 'other' }],
          metrics: [{ label: 'Revenue', queryId: saved.queryId, field: 'revenue' }],
        }),
      },
      renderChart
    );
    const next = await renderReport(
      {
        previous: first.dataOutput,
        output: join(directory, 'v2.html'),
        spec: await spec(
          {
            sections: [{ ...original, conclusion: 'Revised interpretation.' }],
          },
          'patch.json'
        ),
      },
      renderChart
    );
    const report = JSON.parse(await readFile(next.dataOutput, 'utf8'));
    expect(report.sections).toHaveLength(2);
    expect(report.sections[0].conclusion).toBe('Revised interpretation.');
    expect(report.queries[0].result.data[0].revenue).toBe('9007199254740993');
    expect(report.metrics[0].rowIndex).toBe(0);
  });

  it('rejects unknown evidence, inline data and incorrect field bindings before writing outputs', async () => {
    const saved = await query();
    const cases = [
      { ...section('q_' + '0'.repeat(64)) },
      { ...section(saved.queryId), chartFields: { time: 'missing', value: 'revenue' } },
      { ...section(saved.queryId), chart: { chartType: 'line', config: { data: [] } } },
      { ...section(saved.queryId), id: undefined },
    ];
    for (const item of cases) {
      await expect(
        renderReport(
          {
            evidence,
            output: join(directory, 'bad.html'),
            spec: await spec({
              title: 'Sales',
              summary: 'Test',
              sections: [item],
            }),
          },
          renderChart
        )
      ).rejects.toThrow();
      expect(await readdir(directory)).not.toContain('bad.html');
    }
  });

  it('does not silently coerce chart numbers and validates bindings on empty results', async () => {
    for (const data of [[{ month: 'Jan', revenue: '120' }], []]) {
      const saved = await query({ ...result, data });
      const item = section(saved.queryId);
      if (!data.length) item.chartFields.value = 'missing';
      await expect(
        renderReport(
          {
            evidence,
            output: join(directory, 'bad.html'),
            spec: await spec({
              title: 'Sales',
              summary: 'Test',
              sections: [item],
            }),
          },
          renderChart
        )
      ).rejects.toThrow();
      expect(await readdir(directory)).not.toContain('bad.html');
    }
  });

  it('preserves tables and query code when results are truncated or a renderer fails', async () => {
    const partial = await query({ ...result, truncated: true });
    const whole = await query();
    const invoke = vi.fn(async () => {
      throw new Error('Renderer unavailable');
    });
    const output = await renderReport(
      {
        evidence,
        output: join(directory, 'report.html'),
        spec: await spec({
          title: 'Sales',
          summary: 'Partial chart availability.',
          sections: [section(partial.queryId, 'partial'), section(whole.queryId)],
        }),
      },
      invoke
    );
    expect(invoke).toHaveBeenCalledOnce();
    expect(output.chartCount).toBe(0);
    expect(output.chartErrors.map((item) => item.section)).toEqual([1, 2]);
    const report = JSON.parse(await readFile(output.dataOutput, 'utf8'));
    expect(report.queries).toHaveLength(2);
    expect(report.queries[0].sql).toContain('SELECT month');
    expect(report.queries[0].result.data).toEqual(result.data);
  });

  it('binds histogram, liquid and dual-axis config objects from executed result cells', async () => {
    for (const [chartType, config] of [
      ['histogram', { data: [10, 20, 30] }],
      ['liquid', { percent: 0.4 }],
      ['dual-axes', { categories: ['Jan', 'Feb'], series: [{ type: 'column', data: [10, 20] }] }],
    ] as const) {
      const saved = await query({ schema: [{ name: 'chart_config' }], data: [{ chart_config: config }], rowCount: 1 });
      const output = await renderReport(
        {
          evidence,
          output: join(directory, `${chartType}.html`),
          spec: await spec({
            title: 'Sales',
            summary: 'Native config evidence.',
            sections: [
              {
                id: 'native',
                question: 'Chart?',
                conclusion: 'From the executed result.',
                queryId: saved.queryId,
                chartConfigField: 'chart_config',
                chart: { chartType, config: {} },
              },
            ],
          }),
        },
        renderChart
      );
      expect(output.chartCount).toBe(1);
    }
  });

  it('rejects metric cards from truncated results rather than presenting partial data as a total', async () => {
    const saved = await query({ ...result, truncated: true });
    await expect(
      renderReport(
        {
          evidence,
          output: join(directory, 'partial-metric.html'),
          spec: await spec({
            title: 'Sales',
            summary: 'Test',
            sections: [section(saved.queryId)],
            metrics: [{ label: 'Revenue', queryId: saved.queryId, field: 'revenue' }],
          }),
        },
        renderChart
      )
    ).rejects.toThrow(/truncated/);
    expect(await readdir(directory)).not.toContain('partial-metric.html');
  });

  it('preserves existing outputs and rolls back only newly created files on JSON collisions', async () => {
    const saved = await query();
    const input = await spec({
      title: 'Sales',
      summary: '</script><script>bad()</script>',
      sections: [section(saved.queryId)],
    });
    const output = join(directory, 'report.html');
    await writeFile(join(directory, 'report.json'), 'existing evidence');
    await expect(renderReport({ evidence, spec: input, output }, renderChart)).rejects.toThrow();
    expect(await readFile(join(directory, 'report.json'), 'utf8')).toBe('existing evidence');
    expect(await readdir(directory)).not.toContain('report.html');
    await rm(join(directory, 'report.json'));
    await renderReport({ evidence, spec: input, output }, renderChart);
    expect(await readFile(output, 'utf8')).not.toContain('<script>bad()');
    const before = await readFile(output, 'utf8');
    await expect(renderReport({ evidence, spec: input, output }, renderChart)).rejects.toThrow();
    expect(await readFile(output, 'utf8')).toBe(before);
  });

  it('does not fabricate evidence or retry after execution failure, and supports Python code', async () => {
    const invoke = vi.fn(async () => {
      throw new Error('Outcome uncertain');
    });
    await expect(recordQuery({ evidence, datasetId: 'ds_test', dsl, source: 'sales.csv' }, invoke)).rejects.toThrow(
      'uncertain'
    );
    expect(invoke).toHaveBeenCalledOnce();
    expect(await queryIndex(evidence)).toEqual([]);
    const python = join(directory, 'query.py');
    await writeFile(python, 'result = df.groupby("month", as_index=False).sum()');
    const saved = await recordQuery(
      { evidence, datasetId: 'ds_python', dsl: python, source: 'sales.csv' },
      async () => result
    );
    expect((await queryIndex(evidence)).find((item) => item.queryId === saved.queryId).language).toBe('python');
  });
});
