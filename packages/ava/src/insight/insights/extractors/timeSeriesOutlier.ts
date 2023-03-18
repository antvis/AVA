import { distinct, lowess } from '../../../data';
import { LowessOutput } from '../../../data/statistics/types';
import { LOWESS_N_STEPS, RESIDUALS_OUTLIERS_LIMIT } from '../../constant';

import { findOutliers } from './categoryOutlier';

import type { Datum, Measure, TimeSeriesOutlierInfo } from '../../types';

type OutlierItem = {
  index: number;
  significance: number;
  value: number;
};

// detect the outliers using LOWESS
function findTimeSeriesOutliers(values: number[]): {
  outliers: OutlierItem[];
  baselines: LowessOutput['y'];
  thresholds: [number, number];
} {
  const indexes = Array(values.length)
    .fill(0)
    .map((_, index) => index);
  const baseline = lowess(indexes, values, { nSteps: LOWESS_N_STEPS });
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;
  const residuals = values.map((item, index) => item - baseline.y[index]);
  const { outliers: residualsOutliers, thresholds } = findOutliers(residuals);
  const outliers = residualsOutliers.filter((item) => Math.abs(item.value) / range >= RESIDUALS_OUTLIERS_LIMIT);

  return { outliers, baselines: baseline.y, thresholds };
}

export function extractor(data: Datum[], dimensions: string[], measures: Measure[]): TimeSeriesOutlierInfo[] {
  const dimension = dimensions[0];
  const measure = measures[0].fieldName;
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item?.[measure] as number);
  if (distinct(values) === 1) return [];
  const { outliers, baselines, thresholds } = findTimeSeriesOutliers(values);
  const timeSeriesOutliers: TimeSeriesOutlierInfo[] = outliers.map((item) => {
    const { index, significance } = item;
    return {
      type: 'time_series_outlier',
      dimension,
      measure,
      significance,
      index,
      x: data[index][dimension],
      y: data[index][measure] as number,
      baselines,
      thresholds,
    };
  });
  return timeSeriesOutliers;
}
