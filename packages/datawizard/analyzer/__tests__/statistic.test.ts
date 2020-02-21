import {
  valid,
  missing,
  distinct,
  valueMap,
  median,
  quartile,
  quantile,
  sum,
  mean,
  max,
  min,
  geometricMean,
  harmonicMean,
  variance,
  stdev,
  covariance,
  pearson,
} from '../src/statistic';

test('statistic', () => {
  const data1 = ['张三', '李四', '王五'];
  expect(valid(data1)).toBe(3);
  const data2 = ['张三', '李四', '王五', null, null];
  expect(valid(data2)).toBe(3);
  expect(missing(data1)).toBe(0);
  expect(missing(data2)).toBe(2);
  expect(distinct(data1)).toBe(3);
  const data3 = ['张三', '张三', '张三'];
  const data4 = ['张三', '李四', '张三', '张三', 'Sam'];
  expect(distinct(data3)).toBe(1);
  expect(valueMap(data4)).toEqual({ 张三: 3, 李四: 1, Sam: 1 });
  expect(valueMap([1, null])).toEqual({ 1: 1, null: 1 });
  expect(median([1, 3, 2, 4, 5])).toBe(3);
  expect(median([1, 2, 3, 4])).toBe(2.5);
  expect(() => quartile([1])).toThrowError('array.length cannot be less than 3');
  expect(quartile([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([2.5, 5, 7.5]);
  expect(quartile([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([2.5, 4.5, 6.5]);
  expect(quartile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])).toEqual([3, 6, 9]);
  expect(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9], 25)).toBe(3);
  expect(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9], 60)).toBe(6);
  expect(sum([1, 2, 3])).toBe(6);
  expect(mean([1, 2, 3])).toBe(2);
  const data5 = [5, 20, 40, 80, 100];
  expect(geometricMean(data5).toFixed(4)).toBe('31.6979');
  expect(harmonicMean(data5).toFixed(4)).toBe('16.8067');
  expect(variance(data5)).toBe(1284);
  expect(stdev(data5).toFixed(4)).toBe('35.8329');
  expect(max([1, 2, 3])).toBe(3);
  expect(min([1, 2, 3])).toBe(1);
  expect(min([3, 2, 1])).toBe(1);
  expect(covariance([1.1, 1.9, 3], [5.0, 10.4, 14.6]).toFixed(2)).toBe('3.02');
  expect(pearson([1.1, 1.9, 3], [5.0, 10.4, 14.6]).toFixed(4)).toBe('0.9868');
  expect(pearson([5.0, 10.4, 14.6], [1.1, 1.9, 3]).toFixed(4)).toBe('0.9868');
});
