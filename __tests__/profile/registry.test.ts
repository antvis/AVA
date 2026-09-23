import * as path from 'path';

import { describe, expect, it } from 'vitest';

import { AVA, hasMetric, registerMetrics } from '../../src';
import { getLLMConfig } from '../test-utils';

import type { DuckDBMetric } from '../../src';

describe('profile metric registry', () => {
  it('registers and uses a custom metric', async () => {
    expect(hasMetric('duckdb', 'row_count')).toBe(true);
    expect(hasMetric('interpreter', 'row_count')).toBe(false);

    registerMetrics<DuckDBMetric>('duckdb', [
      {
        id: 'completeness',
        enable: ({ target }) => target === 'column',
        expression: ({ column }) =>
          `CASE WHEN COUNT(*) = 0 THEN NULL ELSE COUNT(${column})::DOUBLE / COUNT(*) END`,
      },
    ]);
    const ava = new AVA({ llm: getLLMConfig() });

    try {
      await ava.load({
        type: 'csv-file',
        options: { path: path.join(__dirname, '../datasets/sales.csv') },
      });
      const profile = await ava.profile({ metrics: ['completeness'] });

      expect(hasMetric('duckdb', 'completeness')).toBe(true);
      expect(hasMetric('interpreter', 'completeness')).toBe(false);
      expect(profile.tables[0].metrics).toEqual({});
      expect(profile.tables[0].fields.find(({ name }) => name === 'quantity')!.metrics.completeness).toBeCloseTo(
        239 / 240
      );
    } finally {
      await ava.dispose();
    }
  });
});
