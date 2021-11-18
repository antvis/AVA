import lowess from '@stdlib/stats-lowess';
import { statistics } from '@antv/data-wizard';
import { Datum, Measure, TimeSeriesOutlierInfo } from '../../interface';
import { findOutliers } from './categoryOutlier';

type OutlierItem = {
  index: number;
  significance: number;
  value: number;
};

// detect the outliers using LOWESS
const findTimeSeriesOutliers = (values: number[]): OutlierItem[] => {
  const indexes = Array(values.length)
    .fill(0)
    .map((_, index) => index);
  const fitted = lowess(indexes, values, { nsteps: 1 });
  const max = Math.max(...values);
  const min = Math.max(...values);
  const range = max - min;
  const residuals = values.map((item, index) => item - fitted.y[index]);
  const residualsOutliers: OutlierItem[] = findOutliers(residuals);
  const candidates = residualsOutliers.filter((item) => Math.abs(item.value) / range >= 0.05);

  return candidates;
};

export const extractor = (data: Datum[], dimensions: string[], measures: Measure[]): TimeSeriesOutlierInfo[] => {
  const dimension = dimensions[0];
  const measure = measures[0].field;
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item?.[measure] as number);
  if (statistics.distinct(values) === 1) return [];
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
};
