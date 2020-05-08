import { insightsFromData } from '../src/insight';

test('insights', () => {
  const data = [
    { A: 43, B: 99, C: 87 },
    { A: 21, B: 65, C: 56 },
    { A: 25, B: 79, C: 69 },
    { A: 42, B: 75, C: 63 },
    { A: 57, B: 87, C: 77 },
    { A: 59, B: 81, C: 78 },
  ];

  expect(insightsFromData(data)).toStrictEqual([{ type: 'Correlation', fields: ['B', 'C'] }]);
});
