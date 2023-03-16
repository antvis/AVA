import { isNumber, mergeWith } from 'lodash';

import { nOnes, nZeros } from '../utils';

import { median } from './base';
import { DEFAULT_LOWESS_OPTIONS } from './constants';
import { LowessOptions, LowessOutput } from './types';
import {
  constructDiagonalMatrix,
  inverseSecondOrderMatrix,
  matrixTranspose,
  multiMatrixMultiply,
  vectorSubtract,
} from './vector';

export const tricubeWeightFunction = (x: number): number => {
  if (!isNumber(x) || Math.abs(x) >= 1) return 0;
  return (1 - Math.abs(x) ** 3) ** 3;
};

export const bisquareWeightFunction = (x: number): number => {
  if (!isNumber(x) || Math.abs(x) >= 1) return 0;
  return (1 - x ** 2) ** 2;
};

export const weightedLinearRegression = (x: number[], y: number[], w: number[]) => {
  /** dimension: 2*n */
  const xt = [nOnes(x.length), x];
  /** dimension: n*2 */
  const xMatrix = matrixTranspose(xt);
  /** dimension: n*1 */
  const yMatrix = matrixTranspose([y]);
  /** diagonal matrix with w as the main diagonal */
  const wMatrix = constructDiagonalMatrix(w);
  /**
   * (X^(T)wX)^(-1)
   * - 2*n, n*n, n*2 => 2*2
   * */
  const factor = inverseSecondOrderMatrix(multiMatrixMultiply([xt, wMatrix, xMatrix]));
  /**
   * (X^(T)wX)^(-1) X^(T)wY
   * - 2*2, 2*n, n*1 => 2*1
   * */
  return multiMatrixMultiply([factor, xt, wMatrix, yMatrix]);
};

/**
 * Locally weighted regression
 * - General idea: perform weighted linear regression on localized subsets of the data point by point to calculate fitted value.
 * - Reference: William S. Cleveland. Robust Locally Weighted Regression and Smoothing Scatterplots. Journal of the American Statistical Association. 1979. Vol. 74(368):829-836.
 * */
export const lowess = (x: number[], y: number[], options?: LowessOptions): LowessOutput => {
  const xLength = x.length;
  const mergeOptions = mergeWith(DEFAULT_LOWESS_OPTIONS, options, (defaultValue, inputValue) => {
    return inputValue ?? defaultValue;
  });
  // length of subset
  const r = Math.ceil(xLength * mergeOptions.f);
  // for each i, hi be the distance from xi to the rth nearest neighbor of xi
  const h = x.map((xi) => {
    // rth smallest number among |xi - xj|, for j = 1, ..., n
    return x.map((xj) => Math.abs(xi - xj)).sort((a, b) => a - b)[r];
  });
  // weight, n*n
  const w = x.map((xi, i) => {
    // wk(xi) = weightFunc((xk - xi)/hi), for k = 1, ..., n
    return x.map((xk) => tricubeWeightFunction((xk - xi) / h[i]));
  });
  const robustCoefficient = nOnes(xLength);
  /** fitted values */
  const yFit = nZeros(xLength);
  for (let iter = 0; iter < mergeOptions.nSteps; iter += 1) {
    for (let i = 0; i < xLength; i += 1) {
      const robustWeight = w[i].map((wik, k) => wik * robustCoefficient[k]);
      const beta = weightedLinearRegression(x, y, robustWeight);
      yFit[i] = beta[0][0] + beta[1][0] * x[i];
    }
    const residuals = vectorSubtract(y, yFit);
    /** median of |residuals| */
    const s = median(residuals.map((res) => Math.abs(res)));
    residuals.forEach((res, i) => {
      robustCoefficient[i] = bisquareWeightFunction(res / (6 * s));
    });
  }
  return {
    y: yFit,
  };
};
