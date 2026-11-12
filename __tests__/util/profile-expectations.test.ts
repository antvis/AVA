import { expect, it } from 'vitest';

import { profileExpectations } from '../../src/util/profile-expectations';

it('generates bounds, order and allowed sets only from saved observations', () => {
  const [suite] = profileExpectations(
    {
      models: [
        {
          name: 'data',
          metrics: {},
          columns: [
            {
              name: 'amount',
              properties: { logicalType: 'numeric' },
              metrics: {
                null_count: 0,
                unique_ratio: 1,
                min: 1,
                max: 3,
                monotonicity: { increasing: true, strictly_increasing: true },
              },
            },
            {
              name: 'region',
              properties: { logicalType: 'string' },
              metrics: {
                distinct_count: 2,
                value_counts: [
                  { value: 'North', count: 3 },
                  { value: 'South', count: 1 },
                ],
              },
            },
            { name: 'note', properties: { logicalType: 'string' }, metrics: { distinct_count: 2, top_values: [] } },
          ],
        },
      ],
    },
    { name: 'sample' }
  );
  expect(suite.expectation_suite_name).toBe('sample');
  expect(suite.expectations).toEqual(
    expect.arrayContaining([
      { expectation_type: 'expect_column_values_to_not_be_null', kwargs: { column: 'amount' } },
      { expectation_type: 'expect_column_values_to_be_unique', kwargs: { column: 'amount' } },
      { expectation_type: 'expect_column_values_to_be_increasing', kwargs: { column: 'amount', strictly: true } },
      {
        expectation_type: 'expect_column_values_to_be_between',
        kwargs: { column: 'amount', min_value: 1, max_value: 3 },
      },
      {
        expectation_type: 'expect_column_values_to_be_in_set',
        kwargs: { column: 'region', value_set: ['North', 'South'] },
      },
    ])
  );
  expect(suite.expectations.filter(({ kwargs }) => kwargs.column === 'note')).toEqual([
    { expectation_type: 'expect_column_to_exist', kwargs: { column: 'note' } },
  ]);
});
