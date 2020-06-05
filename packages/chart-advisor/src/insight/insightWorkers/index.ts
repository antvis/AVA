import { RowData } from '@antv/dw-transform';
import { Insight } from '..';

import { correlationIW } from './correlation';
import { monotonicityIW } from './monotonicity';
import { trendIW as viTrendIW } from './vi-trend';

const tuple = <T extends string[]>(...args: T) => args;

export const INSIGHT_TYPES = tuple(
  'Correlation',
  'Monotonicity',
  // todo...
  'MajorFactors',
  'CategoryOutliers',
  'TimeSeriesOutliers',
  'OverallTrends',
  'Seasonality',
  'ChangePoints'
);

export type InsightType = typeof INSIGHT_TYPES[number];

export type Worker = (data: RowData[]) => Insight[] | Promise<Insight[]>;

export const insightWorkers: Partial<Record<InsightType, Worker>> = {
  Correlation: correlationIW,
  Monotonicity: monotonicityIW,
  // OverallTrends: viTrendIW,
};

export { correlationIW, viTrendIW, monotonicityIW };
