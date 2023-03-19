import { orderBy } from 'lodash';

import { distinct } from '../../../data';
import { categoryOutlier } from '../../algorithms';
import { IQR_K, SIGNIFICANCE_BENCHMARK } from '../../constant';
import { Datum, Measure, CategoryOutlierInfo } from '../../types';
import { calculatePValue } from '../util';

type OutlierItem = {
  index: number;
  significance: number;
  value: number;
};

type OutlierCandidateItem = {
  index: number;
  type: 'lower' | 'upper';
  value: number;
};

export const findOutliers = (values: number[]): { outliers: OutlierItem[]; thresholds: [number, number] } => {
  const IQRResult = categoryOutlier.IQR(values, { k: IQR_K });
  const lowerOutlierIndexes = IQRResult.lower.indexes;
  const upperOutlierIndexes = IQRResult.upper.indexes;
  const candidates: OutlierCandidateItem[] = [];
  lowerOutlierIndexes.forEach((index) => {
    const value = values[index];
    candidates.push({
      index,
      type: 'lower',
      value,
    });
  });
  upperOutlierIndexes.forEach((index) => {
    const value = values[index];
    candidates.push({
      index,
      type: 'upper',
      value,
    });
  });
  const sortedCandidates = orderBy(candidates, (item) => Math.abs(IQRResult[item.type].threshold - item.value), [
    'desc',
  ]);

  const outliers: OutlierItem[] = [];
  for (let i = 0; i < sortedCandidates.length; i += 1) {
    const candidate = sortedCandidates[i];
    const { value } = candidate;
    const pValue = calculatePValue(values, value, 'two-sided');

    const significance = 1 - pValue;

    if (significance < SIGNIFICANCE_BENCHMARK) {
      break;
    }

    outliers.push({
      index: candidate.index,
      value: candidate.value,
      significance,
    });
  }
  return { outliers, thresholds: [IQRResult.lower.threshold, IQRResult.upper.threshold] };
};

export function extractor(data: Datum[], dimensions: string[], measures: Measure[]): CategoryOutlierInfo[] {
  const dimension = dimensions[0];
  const measure = measures[0].fieldName;
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item?.[measure] as number);
  if (distinct(values) === 1) return [];
  const { outliers } = findOutliers(values);
  const categoryOutliers: CategoryOutlierInfo[] = outliers.map((item) => {
    const { index, significance } = item;
    return {
      type: 'category_outlier',
      dimension,
      measure,
      significance,
      index,
      x: data[index][dimension],
      y: data[index][measure] as number,
    };
  });
  return categoryOutliers;
}
