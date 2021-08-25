import _sortBy from 'lodash/sortBy';
import { IQR } from '../../algorithms';
import { SignificanceBenchmark } from '../../constant';
import { Datum, OutlierInfo } from '../../interface';
import { calculatePValue } from '../util';

type OutlierCandidate = {
  index: number;
  type: 'upper' | 'lower';
  value: number;
};

export const findOutliers = (values: number[]): OutlierInfo[] => {
  const IQRResult = IQR(values);

  const lowerOutlierIndexes = IQRResult.lower.indexes;
  const upperOutlierIndexes = IQRResult.upper.indexes;
  const candidates: OutlierCandidate[] = [];
  lowerOutlierIndexes.forEach((item) => {
    const value = values[item];
    candidates.push({
      index: item,
      type: 'lower',
      value,
    });
  });
  upperOutlierIndexes.forEach((item) => {
    const value = values[item];
    candidates.push({
      index: item,
      type: 'upper',
      value,
    });
  });
  const sortedCandidates = _sortBy(candidates, (item) => Math.abs(IQRResult[item.type].threshold - item.value));

  const result: OutlierInfo[] = [];

  for (let i = 0; i < sortedCandidates.length; i += 1) {
    const candidate = sortedCandidates[i];
    const pValue = calculatePValue(values, candidate.value);
    const significance = 1 - pValue;

    if (significance < SignificanceBenchmark) {
      break;
    }
    result.push({
      index: candidate.index,
      value: candidate.value,
      significance,
      type: 'category_outlier',
    });
  }
  return result;
};

export const findCategoryOutliers = (data: Datum[], measureKey: string): OutlierInfo[] => {
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item?.[measureKey] as number);
  const outliers = findOutliers(values);
  return outliers;
};
