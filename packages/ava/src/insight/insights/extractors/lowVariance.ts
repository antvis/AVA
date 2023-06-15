import { coefficientOfVariance, mean } from '../../../data';

import type { InsightExtractorProp, LowVarianceInfo } from '../../types';

type LowVarianceItem = {
  significance: number;
  mean: number;
};

type LowVarianceParams = {
  cvThreshold?: number;
};

// Coefficient of variation threshold
const CV_THRESHOLD = 0.15;

export function findLowVariance(values: number[], params?: LowVarianceParams): LowVarianceItem | null {
  const cv = coefficientOfVariance(values);

  const cvThreshold = params?.cvThreshold || CV_THRESHOLD;
  if (cv >= cvThreshold) {
    return null;
  }
  // The smaller the CV is, the greater the significance is.
  const significance = 1 - cv;
  const meanValue = mean(values);

  return {
    significance,
    mean: meanValue,
  };
}

export function extractor({ data, dimensions, measures }: InsightExtractorProp): LowVarianceInfo[] {
  const dimension = dimensions[0];
  const measure = measures[0].fieldName;
  if (!data || data.length === 0) return [];

  const values = data.map((item) => Number(item?.[measure]));
  const lowVariance = findLowVariance(values);

  if (lowVariance) {
    const { significance, mean } = lowVariance;
    return [
      {
        type: 'low_variance',
        dimension,
        measure,
        significance,
        mean,
      },
    ];
  }
  return [];
}
