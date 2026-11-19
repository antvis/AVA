import { describe, expect, it, vi } from 'vitest';

import { AVA, qualityOutputSchema } from '../../../src';
import { assessQuality } from '../../../src/util/quality';

describe('profile quality', () => {
  it('uses the strongest saved correlation for each pair across methods', () => {
    const quality = assessQuality(
      {
        models: [
          {
            name: 'data',
            columns: [],
            metrics: {
              pearson: {
                columns: ['a', 'b'],
                matrix: [
                  [1, 0.91],
                  [0.91, 1],
                ],
              },
              spearman: {
                columns: ['b', 'a'],
                matrix: [
                  [1, -0.98],
                  [-0.98, 1],
                ],
              },
              kendall: {
                columns: ['a', 'b'],
                matrix: [
                  [1, 0.95],
                  [0.95, 1],
                ],
              },
            },
          },
        ],
      },
      { rules: ['high_correlation'] }
    );
    expect(quality.models[0].alerts).toEqual([
      { rule: 'high_correlation', column: 'a', relatedColumn: 'b', value: -0.98, threshold: 0.9 },
    ]);
  });
  it('uses saved DuckDB observations without scanning the dataset again', async () => {
    const ava = new AVA({ llm: { model: 'unused' } });
    try {
      const values = [1, 2, 3, 4, 4, null];
      await ava.source({
        type: 'json',
        options: {
          data: values.map((n) => ({
            amount: n,
            inverse: n == null ? null : -n,
            region: 'US',
          })),
        },
      });
      await expect(ava.quality()).rejects.toThrow('Please call profile() first');
      await ava.profile({
        metrics: ['row_count', 'null_count', 'distinct_count', 'pearson', { id: 'row_duplicates', limit: 0 }],
      });
      const profile = vi.spyOn(ava.engine!, 'profile');
      const quality = qualityOutputSchema.parse(await ava.quality());
      expect(quality.models[0].alerts).toEqual([
        { rule: 'constant', column: 'region', value: 1 },
        { rule: 'duplicates', value: 1 },
        {
          rule: 'high_correlation',
          column: 'amount',
          relatedColumn: 'inverse',
          value: expect.closeTo(-1, 12),
          threshold: 0.9,
        },
        { rule: 'missing', column: 'amount', value: 1 / 6, threshold: 0.01 },
        { rule: 'missing', column: 'inverse', value: 1 / 6, threshold: 0.01 },
      ]);
      expect((await ava.quality({ rules: ['missing'], ratioThreshold: 0.2 })).models[0].alerts).toEqual([]);
      expect((await ava.quality({ rules: ['duplicates'] })).models[0].alerts).toEqual([
        { rule: 'duplicates', value: 1 },
      ]);
      expect(profile).not.toHaveBeenCalled();
      await expect(ava.quality({ ratioThreshold: 2 })).rejects.toThrow();

      await ava.source({ type: 'json', options: { data: [{ amount: 9 }] } });
      await expect(ava.quality()).rejects.toThrow('Please call profile() first');
    } finally {
      await ava.dispose();
    }
  });
});
