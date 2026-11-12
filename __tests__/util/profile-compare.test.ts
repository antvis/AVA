import { expect, it } from 'vitest';

import { compareProfiles } from '../../src/util/profile-compare';

it('aligns models, columns, and metrics and preserves missing observations', () => {
  const column = (name: string, metrics: Record<string, number | null>) => ({
    name,
    metrics,
    properties: { logicalType: 'numeric' },
  });
  const before = {
    models: [
      {
        name: 'data',
        metrics: { row_count: 10 },
        columns: [column('a', { min: null, max: 10 }), column('gone', { max: 5 })],
      },
    ],
  };
  const after = {
    models: [
      {
        name: 'data',
        metrics: { row_count: 12 },
        columns: [column('new', { min: 3 }), column('a', { min: 1, max: 14 })],
      },
    ],
  };
  const model = compareProfiles(before, after).models[0];
  expect(model.metrics).toEqual([{ name: 'row_count', before: 10, after: 12, delta: 2 }]);
  expect(model.columns.map(({ name }) => name)).toEqual(['a', 'gone', 'new']);
  expect(model.columns[0].metrics).toEqual([
    { name: 'min', before: null, after: 1 },
    { name: 'max', before: 10, after: 14, delta: 4 },
  ]);
  expect(model.columns[1].after).toBeUndefined();
  expect(model.columns[2].before).toBeUndefined();
  expect(() => compareProfiles(before, { ...after, semantics: 'data-profiling' })).toThrow('matching metric semantics');
});
