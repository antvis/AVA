import { orderBy } from 'lodash';

import { distinct, mean } from '../../../data';
import { categoryOutlier } from '../../algorithms';
import { IQR_K, SIGNIFICANCE_BENCHMARK } from '../../constant';
import { CategoryOutlierInfo, InsightExtractorProp, InsightOptions } from '../../types';
import { calculatePValue, calculateOutlierThresholds } from '../util';

type OutlierItem = {
  index: number;
  significance: number;
  value: number;
};

export const findOutliers = (
  values: number[],
  options?: InsightOptions
): { outliers: OutlierItem[]; thresholds: [number, number] } => {
  const { method, iqrK, confidenceInterval = SIGNIFICANCE_BENCHMARK } = options?.algorithmParameter?.outlier || {};
  const outliers: OutlierItem[] = [];
  const thresholds = [];
  const candidates = values.map((item, index) => {
    return { index, value: item };
  });
  if (method !== 'p-value') {
    const IQRResult = categoryOutlier.IQR(values, { k: iqrK ?? IQR_K });
    const lowerOutlierIndexes = IQRResult.lower.indexes;
    const upperOutlierIndexes = IQRResult.upper.indexes;
    [...lowerOutlierIndexes, ...upperOutlierIndexes].forEach((index) => {
      const value = values[index];
      const pValue = (candidates.findIndex((item) => item.value === value) + 1) / values.length;
      // two-sided
      const significance = pValue > 0.5 ? pValue : 1 - pValue;
      outliers.push({
        index,
        value,
        significance,
      });
    });
    thresholds.push(IQRResult.lower.threshold, IQRResult.upper.threshold);
  } else {
    const sortedCandidates = orderBy(candidates, (item) => Math.abs(mean(values) - item.value), ['desc']);
    thresholds.push(...calculateOutlierThresholds(values, confidenceInterval, 'two-sided'));

    for (let i = 0; i < sortedCandidates.length; i += 1) {
      const candidate = sortedCandidates[i];
      const { value, index } = candidate;
      const pValue = calculatePValue(values, value, 'two-sided');

      const significance = 1 - pValue;

      if (significance < confidenceInterval) {
        break;
      }

      outliers.push({
        index,
        value,
        significance,
      });
    }
  }

  return { outliers, thresholds: thresholds as [number, number] };
};

export function extractor({ data, dimensions, measures, options }: InsightExtractorProp): CategoryOutlierInfo[] {
  const dimension = dimensions[0];
  const measure = measures[0].fieldName;
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item?.[measure] as number);
  if (distinct(values) === 1) return [];
  const { outliers } = findOutliers(values, options);
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
