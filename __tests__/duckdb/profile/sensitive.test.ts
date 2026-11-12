import { expect, it } from 'vitest';

import { AVA } from '../../../src';

it('omits row samples and value-bearing metrics in sensitive profiles', async () => {
  const ava = new AVA({ llm: { model: 'unused' } });
  try {
    await ava.source({ type: 'json', options: { data: [{ label: 'sensitive-value', number: 3 }] } });
    const metrics = [
      'row_count',
      'row_sample',
      'row_duplicates',
      'min',
      'top_values',
      'mode',
      'value_counts',
      'word_counts',
      'unicode_summary',
    ];
    const result = await ava.profile({ sensitive: true, metrics });
    expect(result.sensitive).toBe(true);
    expect(result.models[0].metrics).toEqual({ row_count: 1 });
    expect(result.models[0].columns.find(({ name }) => name === 'number')?.metrics).toEqual({ min: 3 });
    expect(JSON.stringify(result)).not.toContain('sensitive-value');
    expect(JSON.stringify(await ava.profile({ metrics }))).toContain('sensitive-value');
  } finally {
    await ava.dispose();
  }
});
