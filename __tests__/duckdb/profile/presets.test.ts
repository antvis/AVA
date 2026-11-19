import { expect, it } from 'vitest';

import { AVA } from '../../../src';

it('applies DuckDB profile presets and preserves explicit metric selection', async () => {
  const ava = new AVA({ llm: { model: 'unused' } });
  try {
    await ava.source({
      type: 'json',
      options: {
        data: Array.from({ length: 8 }, (_, n) => ({
          amount: n + 1,
          url: n % 2 ? 'https://example.com/a' : 'https://example.com/b',
        })),
      },
    });
    const minimal = await ava.profile({ preset: 'minimal' });
    expect(minimal.semantics).toBe('data-profiling');
    expect(minimal.models[0].metrics).toHaveProperty('table_summary.row_count', 8);
    expect(minimal.models[0].metrics).not.toHaveProperty('scatter_pairs');
    expect(minimal.models[0].columns[0].metrics).toHaveProperty('median', 4.5);
    const explorative = await ava.profile({ preset: 'explorative' });
    expect(explorative.models[0].columns[1].properties.profileType).toBe('URL');
    expect(explorative.models[0].columns[1].metrics).toHaveProperty('url_summary');
    expect(explorative.models[0].metrics).toHaveProperty('scatter_pairs');
    expect((await ava.profile({ preset: 'explorative', metrics: ['row_count'] })).models[0].metrics).toEqual({
      row_count: 8,
    });
  } finally {
    await ava.dispose();
  }
});
