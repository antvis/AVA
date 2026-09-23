import { expect, it } from 'vitest';

import { BUILTIN_METRICS } from '../../src/duckdb/profile';
import { validateMetricConfig } from '../../src/util/profile';

it('validates metric options without treating the metric id as an option', () => {
  expect(validateMetricConfig({ id: 'row_count' }, BUILTIN_METRICS)).toBe(true);
  expect(validateMetricConfig({ id: 'top_values', limit: 2 }, BUILTIN_METRICS)).toBe(true);
  expect(() => validateMetricConfig({ id: 'row_count', limit: 2 }, BUILTIN_METRICS)).toThrow(
    'Unknown option for row_count: limit'
  );
  expect(() => validateMetricConfig({ id: 'top_values', limit: -1 }, BUILTIN_METRICS)).toThrow(
    'top_values.limit must be a non-negative safe integer'
  );
});
