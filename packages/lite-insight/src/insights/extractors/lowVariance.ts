import { statistics } from '@antv/data-wizard';
import { Datum, LowVarianceInfo, Measure } from '../../interface';

type LowVarianceItem = {
  significance: number;
  mean: number;
};

type LowVarianceParams = {
  cvThreshold?: number;
};

// Coefficient of variation threshold
const CV_THRESHOLD = 0.15;

export const findLowVariance = (values: number[], params?: LowVarianceParams): LowVarianceItem => {
  const cv = statistics.coefficientOfVariance(values);

  const cvThreshold = params?.cvThreshold || CV_THRESHOLD;
  if (cv >= cvThreshold) {
    return null;
  }
  // The smaller the CV is, the greater the significance is.
  const significance = 1 - cv;
  const mean = statistics.mean(values);

  return {
    significance,
    mean,
  };
};

export const extractor = (data: Datum[], dimensions: string[], measures: Measure[]): LowVarianceInfo[] => {
  const dimension = dimensions[0];
  const measure = measures[0].field;
  if (!data || data.length === 0) return [];

  const values = data.map((item) => item?.[measure] as number);
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
};
