import { autoTransform } from '../src/autoTransform';

test('autoTransform', () => {
  expect(
    autoTransform([
      { gender: 'Male', height: 180 },
      { gender: 'Female', height: 165 },
      { gender: 'Male', height: 170 },
    ]).schemas
  ).toEqual([
    {
      groupBy: ['gender'],
      actions: [
        {
          type: 'sum',
          field: 'height',
          as: 'SUM(height)',
        },
      ],
    },
  ]);
});

test('autoTransform', () => {
  expect(
    autoTransform([
      { gender: 'Male', height: 180 },
      { gender: 'Female', height: 165 },
      { gender: 'Male', height: 170 },
    ]).result
  ).toEqual([
    { gender: 'Male', 'SUM(height)': 350 },
    { gender: 'Female', 'SUM(height)': 165 },
  ]);
});
