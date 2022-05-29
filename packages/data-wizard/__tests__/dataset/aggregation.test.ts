import DataFrame from '../../src/dataset/data-frame';
import { aggregateDataFrame } from '../../src/dataset/aggregation/utils';
import AutoAggregation from '../../src/dataset/aggregation/auto-aggregation';

test('aggregate', () => {
  const inputData = [
    { gender: 'male', score: 99 },
    { gender: 'male', score: 98 },
    { gender: 'male', score: 97 },
    { gender: 'female', score: 99 },
    { gender: 'female', score: 98 },
    { gender: 'female', score: 92 },
  ];
  const dataFrame = new DataFrame(inputData);
  expect(aggregateDataFrame(dataFrame, ['gender'], ['score']).data[0][1]).toStrictEqual(294);

  expect(new AutoAggregation(dataFrame).deDuplication().data[0][1]).toStrictEqual(294);
});
