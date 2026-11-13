import { expect, it } from 'vitest';

import { renderProfileHtml } from '../../src/util/profile-report';

it('escapes saved values and renders nested tables, distributions and alerts', () => {
  const html = renderProfileHtml(
    {
      models: [
        {
          name: '<dataset>',
          metrics: { row_count: 3 },
          columns: [
            {
              name: '<script>alert(1)</script>',
              properties: { logicalType: 'numeric' },
              metrics: {
                distinct_count: 1,
                histogram: { bin_edges: [1, 2], counts: [3] },
                top_values: [{ value: '<img src=x onerror=alert(1)>', count: 3 }],
              },
            },
          ],
        },
      ],
    },
    { title: 'Before & after', theme: 'dark', fullWidth: true, transparent: true }
  );
  expect(html).toContain('<title>Before &amp; after</title>');
  expect(html).toContain('data-theme="dark"');
  expect(html).toContain('<body class="transparent full-width">');
  expect(html).toContain('&lt;dataset&gt;');
  expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('<img');
  expect(html).toContain('class="histogram-plot"');
  expect(html).toContain('<summary>Bin values</summary>');
  expect(html).toContain('Quality alerts');
});

it('plots saved frequencies and missingness and formats the date axis', () => {
  const html = renderProfileHtml({
    semantics: 'data-profiling',
    models: [
      {
        name: 'data',
        metrics: { row_count: 4, missing_bands: { columns: ['date'], bands: [{ start: 0, end: 4, present: [0.75] }] } },
        columns: [
          {
            name: 'date',
            properties: { logicalType: 'date' },
            metrics: { null_count: 1, histogram: { bin_edges: [0, 86400000, 172800000], counts: [1, 2] } },
          },
          {
            name: 'category',
            properties: { logicalType: 'string' },
            metrics: { value_counts: Array.from({ length: 12 }, (_, i) => ({ value: `value-${i}`, count: 12 - i })) },
          },
        ],
      },
    ],
  });
  expect(html).toContain('Missing values by column');
  expect(html).toContain('25%</span>');
  expect(html).toContain('Missingness matrix');
  expect(html).toContain('1970-01-03');
  expect(html).toContain('Other (2 values)');
  expect(html).toContain('<th scope="row">value-11</th><td>1</td>');
});
