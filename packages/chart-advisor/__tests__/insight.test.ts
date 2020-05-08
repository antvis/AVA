import { insightsFromData } from '../src/insight';

test('insights', () => {
  const data = [
    { A: 43, B: 99, C: 87, D: 57 },
    { A: 21, B: 65, C: 56, D: 80 },
    { A: 25, B: 79, C: 69, D: 75 },
    { A: 42, B: 75, C: 63, D: 60 },
    { A: 57, B: 87, C: 77, D: 43 },
    { A: 59, B: 81, C: 78, D: 40 },
  ];

  expect(insightsFromData(data)).toStrictEqual([
    {
      type: 'Correlation',
      fields: ['A', 'D'],
    },
    {
      type: 'Correlation',
      fields: ['B', 'C'],
    },
  ]);
});
