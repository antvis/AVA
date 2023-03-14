import { distinct } from '../../../data';
import { lowess } from '../../../data/statistics/stdlib';

import { findOutliers } from './categoryOutlier';

import type { Datum, Measure, TimeSeriesOutlierInfo } from '../../types';

type OutlierItem = {
  index: number;
  significance: number;
  value: number;
};

// detect the outliers using LOWESS
function findTimeSeriesOutliers(values: number[]): OutlierItem[] {
  const indexes = Array(values.length)
    .fill(0)
    .map((_, index) => index);
  const fitted = lowess(indexes, values, { nSteps: 2 });
  const max = Math.max(...values);
  const min = Math.max(...values);
  const range = max - min;
  const residuals = values.map((item, index) => item - fitted.y[index]);
  const residualsOutliers: OutlierItem[] = findOutliers(residuals);
  const candidates = residualsOutliers.filter((item) => Math.abs(item.value) / range >= 0.05);

  return candidates;
}

export function extractor(data: Datum[], dimensions: string[], measures: Measure[]): TimeSeriesOutlierInfo[] {
  const dimension = dimensions[0];
  const measure = measures[0].field;
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item?.[measure] as number);
  if (distinct(values) === 1) return [];
  const outliers: TimeSeriesOutlierInfo[] = findTimeSeriesOutliers(values).map((item) => {
    const { index, significance } = item;
    return {
      type: 'time_series_outlier',
      dimension,
      measure,
      significance,
      index,
      x: data[index][dimension],
      y: data[index][measure] as number,
    };
  });
  return outliers;
}
