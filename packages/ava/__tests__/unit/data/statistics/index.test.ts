import '@testing-library/jest-dom/extend-expect';
import { isEqual } from 'lodash';

import { isArray, isNumber, nOnes, range } from '../../../../src/data';
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
  pcorrtest,
} from '../../../../src/data/statistics';

const threshold = 1e-3;
/** whether two arrays are the same within a certain precision  */
const isCloseArray = (realArray: number[] | number[][], compareArray: number[] | number[][]) => {
  const reject = realArray
    .map((value: number | number[], i) => {
      const compareValue = compareArray[i];
      if (isArray(value) && isArray(compareValue)) return Math.abs(value[0] - compareValue[0]) < threshold;
      if (isNumber(value) && isNumber(compareValue)) return Math.abs(value - compareValue) < threshold;
      return false;
    })
    .includes(false);
  return !reject;
};

expect.extend({
  toBeCloseToArray(received: number[] | number[][], argument: number[] | number[][]) {
    const pass = isCloseArray(argument, received);
    return {
      message: () => `expect ${received} to be close to ${argument}`,
      pass,
    };
  },
  toBeCloseToObject(received: Record<string, any>, argument: Record<string, any>) {
    const reject = Object.keys(received)
      .map((key) => {
        const realValue = argument[key];
        const compareValue = received[key];
        if (isNumber(realValue) && isNumber(compareValue)) return Math.abs(compareValue - realValue) < threshold;
        if (isArray(realValue) && isArray(compareValue)) {
          return isCloseArray(realValue, compareValue);
        }
        return isEqual(compareValue, realValue);
      })
      .includes(false);
    return {
      message: () => `expect ${received} to be close to ${argument}`,
      pass: !reject,
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

  // 不小于均值
  expect(cdf(-0.1, -0.1, 2)).toBeCloseTo(0.5);
  expect(cdf(2, 0, 1)).toBeCloseTo(0.977);
  expect(cdf(2, 2, -3)).toBe(NaN);
  // 小于均值
  const cdfTestData = [
    -31.20860982319482, 12.590973577445197, 6.405819130157852, 40.749230591240234, 20.729801362383682,
    -61.037096924074945, -67.5656613441704, 1.336135458046897, 124.85998285693745, 27.915065732344942,
    -9.261606232548274, 14.535172710349343, 66.9231081402304, 25.407440121578702, -8.392386043428473,
    -54.91091630601909,
  ];
  expect(cdf(cdfTestData[0], mean(cdfTestData), standardDeviation(cdfTestData))).toBeCloseTo(0.2103);
  expect(cdf(-1.11, 0, 1)).toBeCloseTo(0.1334);

  expect(maxabs([0, 2, -7])).toBe(7);

  expect(normalDistributionQuantile(0.7673, 0, 1)).toBeCloseTo(0.73);
  expect(normalDistributionQuantile(0.5, 10.0, 2.0)).toBeCloseTo(10);
  expect(normalDistributionQuantile(0.504, 0, 1)).toBeCloseTo(0.01);

  // vector/matrix
  const vectorSet = [
    [1, 2, 3],
    [2, 9, 0],
  ];
  const matrix = [
    [1, 2, 3],
    [3, 3, 4],
    [4, 5, 2],
    [4, 1, 2],
  ];
  const matrixSet = [
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
  ];
  const matrixMultiplyResult1 = [
    [20, 20, 18, 13],
    [29, 31, 27, 21],
    [24, 31, 30, 19],
    [16, 19, 14, 15],
  ];
  const matrixMultiplyResult2 = [
    [204, 203, 202],
    [314, 307, 307],
    [313, 310, 294],
    [189, 174, 182],
  ];
  expect(vectorAdd(vectorSet[0], vectorSet[1])).toStrictEqual([3, 11, 3]);
  expect(vectorSubtract(vectorSet[0], vectorSet[1])).toStrictEqual([-1, -7, 3]);
  expect(vectorInnerProduct(vectorSet[0], vectorSet[1])).toBe(20);
  expect(matrixMultiply(matrixSet[0], matrixSet[1])).toStrictEqual(matrixMultiplyResult1);
  expect(multiMatrixMultiply(matrixSet)).toStrictEqual(matrixMultiplyResult1);
  expect(multiMatrixMultiply([...matrixSet, matrix])).toStrictEqual(matrixMultiplyResult2);
  expect(matrixTranspose(matrix)).toStrictEqual([
    [1, 3, 4, 4],
    [2, 3, 5, 1],
    [3, 4, 2, 2],
  ]);
  expect(constructDiagonalMatrix([1, 2, 3])).toStrictEqual([
    [1, 0, 0],
    [0, 2, 0],
    [0, 0, 3],
  ]);
  expect(
    inverseSecondOrderMatrix([
      [1, 3],
      [2, 8],
    ])
  ).toStrictEqual([
    [4, -1.5],
    [-1, 0.5],
  ]);

  // LOWESS
  const linearRegressionSeries = range(9);
  expect(bisquareWeightFunction(2)).toBe(0);
  expect(tricubeWeightFunction(-3)).toBe(0);
  expect(
    weightedLinearRegression(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [2, 23, 44, 67, 1, 22, 65, -3, -11],
      [0, 0, 0.2, 0.9, 0.5, 0, 0, 0, 0]
    )
  ).toBeCloseToArray([[182.3786], [-33.165]]);
  expect(weightedLinearRegression(linearRegressionSeries, linearRegressionSeries, nOnes(9))).toBeCloseToArray([
    [0],
    [1],
  ]);
  expect(lowess(linearRegressionSeries, linearRegressionSeries, { nSteps: 1 })).toBeCloseToObject({
    y: linearRegressionSeries,
  });

  // Pearson product-moment correlation test
  const x = [0.7, -1.6, -0.2, -1.2, -0.1, 3.4, 3.7, 0.8, 0.0, 2.0];
  const y = [1.9, 0.8, 1.1, 0.1, -0.1, 4.4, 5.5, 1.6, 4.6, 3.4];
  expect(pcorrtest(x, y)).toBeCloseToObject({ rejected: true, pcorr: 0.7951 });
  expect(pcorrtest(x, y, { alpha: 0.1 })).toBeCloseToObject({ rejected: true, pcorr: 0.7951 });
  expect(pcorrtest(x, y, { rho: 0.8 })).toBeCloseToObject({ rejected: false, pcorr: 0.7951 });
});
