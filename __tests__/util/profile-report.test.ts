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
  expect(html).toContain('<meter');
  expect(html).toContain('Quality alerts');
});
