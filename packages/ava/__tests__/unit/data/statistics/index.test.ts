import '@testing-library/jest-dom/extend-expect';
import { isArray, isNumber } from 'lodash';

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
  maxIndex,
  minIndex,
  geometricMean,
  harmonicMean,
  variance,
  standardDeviation,
  covariance,
  pearson,
  coefficientOfVariance,
} from '../../../../src/data/statistics';
import {
  cdf,
  maxabs,
  normalDistributionQuantile,
  vectorAdd,
  vectorInnerProduct,
  vectorSubtract,
  matrixMultiply,
  multiMatrixMultiply,
  matrixTranspose,
  constructDiagonalMatrix,
  inverseSecondOrderMatrix,
  tricubeWeightFunction,
  bisquareWeightFunction,
  weightedLinearRegression,
  lowess,
} from '../../../../src/data/statistics/stdlib';

expect.extend({
  toBeCloseToArray(received: number[] | number[][], argument: number[] | number[][]) {
    const pass = received
      .map((value: number | number[], i) => {
        const compareValue = argument[i];
        if (isArray(value) && isArray(compareValue)) return value[0] - compareValue[0] < 1e-3;
        if (isNumber(value) && isNumber(compareValue)) return value - compareValue < 1e-3;
        return false;
      })
      .includes(false);
    return {
      message: () => `expect ${received} to be close to ${argument}`,
      pass,
    };
  },
});

test('statistics', () => {
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
  expect(() => quartile([1])).toThrowError('The length of value cannot be less than 3.');
  expect(quartile([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([2.5, 5, 7.5]);
  expect(quartile([1, 2, 3, 4, 5, 6, 7, 8, 9], true)).toEqual([2.5, 5, 7.5]);
  expect(quartile([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([2.5, 4.5, 6.5]);
  expect(quartile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])).toEqual([3, 6, 9]);
  expect(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9], 25)).toBe(3);
  expect(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9], 25, true)).toBe(3);
  expect(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9], 60)).toBe(6);

  const data5 = [5, 20, 40, 80, 100];
  expect(geometricMean(data5).toFixed(4)).toBe('31.6979');
  expect(harmonicMean(data5).toFixed(4)).toBe('16.8067');
  expect(variance(data5)).toBe(1284);
  expect(standardDeviation(data5).toFixed(4)).toBe('35.8329');

  const data6 = [1, 2, 3];
  expect(sum(data6)).toBe(6);
  expect(mean(data6)).toBe(2);
  expect(min(data6)).toBe(1);
  expect(min([3, 2, 1])).toBe(1);
  expect(max(data6)).toBe(3);
  expect(minIndex(data5)).toBe(0);
  expect(maxIndex(data5)).toBe(4);
  expect(covariance([1.1, 1.9, 3], [5.0, 10.4, 14.6]).toFixed(2)).toBe('3.02');
  expect(pearson([1.1, 1.9, 3], [5.0, 10.4, 14.6]).toFixed(4)).toBe('0.9868');
  expect(pearson([5.0, 10.4, 14.6], [1.1, 1.9, 3]).toFixed(4)).toBe('0.9868');
  expect(coefficientOfVariance([1, 2, 5, 9, 10, 11]).toFixed(4)).toBe('0.6160');

  // test cache
  expect(geometricMean(data5).toFixed(4)).toBe('31.6979');
  expect(harmonicMean(data5).toFixed(4)).toBe('16.8067');
  expect(variance(data5)).toBe(1284);
  expect(min(data6)).toBe(1);
  expect(max(data6)).toBe(3);
  expect(minIndex(data5)).toBe(0);
  expect(maxIndex(data5)).toBe(4);

  expect(cdf(-0.1, -0.1, 2)).toBe(0.5);
  expect(cdf(2, 0, 1)).toBe(0.977);
  expect(cdf(2, 2, -3)).toBe(NaN);

  expect(maxabs([0, 2, -7])).toBe(7);

  expect(normalDistributionQuantile(0.7673, 0, 1)).toBe(0.73);
  expect(normalDistributionQuantile(0.5, 10.0, 2.0)).toBe(10);
  expect(normalDistributionQuantile(0.504, 0, 1)).toBe(0.01);

  // vector/matrix
  expect(vectorAdd([1, 2, 3], [2, 9, 0])).toBe([3, 11, 3]);
  expect(vectorSubtract([1, 2, 3], [2, 9, 0])).toBe([-1, -7, 3]);
  expect(vectorInnerProduct([1, 2, 3], [2, 9, 0])).toBe([-1, -7, 3]);
  expect(
    matrixMultiply(
      [
        [1, 2, 3],
        [3, 3, 4],
        [4, 5, 2],
        [4, 1, 2],
      ],
      [
        [1, 2, 1, 2],
        [2, 3, 4, 1],
        [5, 4, 3, 3],
      ]
    )
  ).toBe([
    [20, 20, 18, 13],
    [29, 31, 27, 21],
    [24, 31, 30, 19],
    [16, 19, 14, 15],
  ]);
  expect(
    multiMatrixMultiply([
      [
        [1, 2, 3],
        [3, 3, 4],
        [4, 5, 2],
        [4, 1, 2],
      ],
      [
        [1, 2, 1, 2],
        [2, 3, 4, 1],
        [5, 4, 3, 3],
      ],
    ])
  ).toBe([
    [20, 20, 18, 13],
    [29, 31, 27, 21],
    [24, 31, 30, 19],
    [16, 19, 14, 15],
  ]);
  expect(
    multiMatrixMultiply([
      [
        [1, 2, 3],
        [3, 3, 4],
        [4, 5, 2],
        [4, 1, 2],
      ],
      [
        [1, 2, 1, 2],
        [2, 3, 4, 1],
        [5, 4, 3, 3],
      ],
      [
        [1, 2, 3],
        [3, 3, 4],
        [4, 5, 2],
        [4, 1, 2],
      ],
    ])
  ).toBe([
    [204, 203, 202],
    [314, 307, 307],
    [189, 174, 182],
  ]);
  expect(
    matrixTranspose([
      [1, 2, 3],
      [3, 3, 4],
      [4, 5, 2],
      [4, 1, 2],
    ])
  ).toBe([
    [1, 3, 4, 4],
    [2, 3, 5, 1],
    [3, 4, 2, 2],
  ]);
  expect(constructDiagonalMatrix([1, 2, 3])).toBe([
    [1, 0, 0],
    [0, 2, 0],
    [0, 0, 3],
  ]);
  expect(
    inverseSecondOrderMatrix([
      [1, 3],
      [2, 8],
    ])
  ).toBe([
    [4, -1.5],
    [-1, 0.5],
  ]);

  // LOWESS
  expect(bisquareWeightFunction(2)).toBe(0);
  expect(tricubeWeightFunction(-3)).toBe(0);
  expect(
    weightedLinearRegression(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [2, 23, 44, 67, 1, 22, 65, -3, -11],
      [0, 0, 0.2, 0.9, 0.5, 0, 0, 0, 0]
    )
  ).toBeCloseToArray([[-113.4951], [58.4466]]);
  expect(
    weightedLinearRegression([1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 1, 1, 1, 1, 1, 1, 1, 1])
  ).toBeCloseToArray([[0], [1]]);
  expect(lowess([1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 7, 8, 9], { nSteps: 1 })).toBeCloseToArray([
    1, 2, 3, 4, 5, 6, 7, 8, 9,
  ]);
});
