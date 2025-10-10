import _ from 'lodash';

import type { RawDataType, ColumnType } from '@ava/data/types';

export const randomPick = (n: number, m: number) => {
  if (m < 0 || m > n) throw new Error('m must be between 0 and n');

  const result = [];
  const map = new Map();

  for (let i = 0; i < m; i++) {
    const randIndex = Math.floor(Math.random() * (n - i));
    const swapIndex = randIndex + i;

    const selected = map.has(randIndex) ? map.get(randIndex) : randIndex + 1;
    const swappedValue = map.has(swapIndex) ? map.get(swapIndex) : swapIndex + 1;

    result.push(selected);

    map.set(randIndex, swappedValue);
  }

  return result;
};

// 皮尔逊相关系数
export const pearsonCorrelation = (x: number[], y: number[]) => {
  const n = x.length;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  let valid = 0;

  for (let i = 0; i < n; i++) {
    const a = x[i];
    const b = y[i];
    if (typeof a !== 'number' || typeof b !== 'number' || Number.isNaN(a) || Number.isNaN(b)) {
      // do nothing
    } else {
      sumX += a;
      sumY += b;
      sumXY += a * b;
      sumX2 += a * a;
      sumY2 += b * b;
      valid++;
    }
  }

  if (valid < 2) return 0;

  const numerator = sumXY - (sumX * sumY) / valid;
  const denominator = Math.sqrt((sumX2 - (sumX * sumX) / valid) * (sumY2 - (sumY * sumY) / valid));

  if (denominator === 0) return 0;

  return numerator / denominator;
};

// 分类变量 vs 数值变量
export const categoricalToNumericCorrelation = (categories: string[], values: number[]) => {
  const n = categories.length;
  const groups: Record<string, number[]> = {};

  let totalSum = 0;
  let totalSumSq = 0;
  let valid = 0;

  for (let i = 0; i < n; i++) {
    const cat = String(categories[i]);
    const val = values[i];
    if (typeof val !== 'number' || Number.isNaN(val)) {
      // do nothing
    } else {
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(val);

      totalSum += val;
      totalSumSq += val * val;
      valid++;
    }
  }

  if (valid < 2 || Object.keys(groups).length < 2) return 0;

  const overallMean = totalSum / valid;
  const totalVariance = totalSumSq - (totalSum * totalSum) / valid;

  let betweenSum = 0;

  _.each(groups, (value) => {
    const groupSum = value.reduce((a, b) => a + b, 0);
    const mean = groupSum / value.length;
    const diff = mean - overallMean;
    betweenSum += value.length * diff * diff;
  });

  const etaSquared = totalVariance === 0 ? 0 : betweenSum / totalVariance;
  return Math.sqrt(etaSquared);
};

export const categoricalAssociationScore = (cat1: string[], cat2: string[]) => {
  const n = cat1.length;
  let matchCount = 0;
  const jointCounts = {};
  const count1 = {};
  const count2 = {};

  for (let i = 0; i < n; i++) {
    const c1 = String(cat1[i]);
    const c2 = String(cat2[i]);
    const key = `${c1}|${c2}`;
    jointCounts[key] = (jointCounts[key] || 0) + 1;
    count1[c1] = (count1[c1] || 0) + 1;
    count2[c2] = (count2[c2] || 0) + 1;
    if (c1 === c2) matchCount++;
  }

  const pObserved = matchCount / n;

  let pExpected = 0;

  _.each(count1, (_value, key) => {
    const p1 = count1[key] / n;
    const p2 = (count2[key] || 0) / n;
    pExpected += p1 * p2;
  });

  const maxPossible = 1 - pExpected;
  const improvement = pObserved - pExpected;

  if (maxPossible <= 0) return 0;
  const score = Math.max(0, Math.min(1, improvement / maxPossible));
  const entropyJoint = -Object.values(jointCounts).reduce((s: number, cnt: number) => {
    const p = cnt / n;
    return s + p * Math.log(p);
  }, 0);

  // maxEntropy of the joint distribution
  const maxEntropy = -Math.log(1 / n);

  // more entropy means less association
  return (score + (maxEntropy - entropyJoint) / maxEntropy) / 2;
};

export const calculateCorrelation = (
  col1: { type: ColumnType; data: RawDataType[] },
  col2: { type: ColumnType; data: RawDataType[] }
) => {
  const isNumeric1 = ['integer', 'float'].includes(col1.type);
  const isNumeric2 = ['integer', 'float'].includes(col2.type);

  // Step 2: 根据类型选择方法

  if (isNumeric1 && isNumeric2) {
    return Math.abs(pearsonCorrelation(col1.data as number[], col2.data as number[]));
  }

  if (isNumeric1 && !isNumeric2) {
    return categoricalToNumericCorrelation(col2.data as string[], col1.data as number[]);
  }

  if (!isNumeric1 && isNumeric2) {
    return categoricalToNumericCorrelation(col1.data as string[], col2.data as number[]);
  }
  return categoricalAssociationScore(col1.data as string[], col2.data as string[]);
};
