import { RowData } from '@antv/dw-transform';
import { Insight } from '..';

import { correlationIW } from './correlation';
import { monotonicityIW } from './monotonicity';
import { majorFactorsIW } from './major';
import { trendIW as viTrendIW } from './vi-trend';

const tuple = <T extends string[]>(...args: T) => args;

/**
 * @beta
 */
export const INSIGHT_TYPES = tuple(
  'Correlation',
  'Monotonicity',
  'MajorFactors',
  // todo...
  'CategoryOutliers',
  'TimeSeriesOutliers',
  'OverallTrends',
  'Seasonality',
  'ChangePoints'
);

/**
 * @beta
 */
export type InsightType = typeof INSIGHT_TYPES[number];

/**
 * @beta
 */
export type Worker = (data: RowData[]) => Insight[] | Promise<Insight[]>;

/**
 * @beta
 */
export const insightWorkers: Partial<Record<InsightType, Worker>> = {
  Correlation: correlationIW,
  Monotonicity: monotonicityIW,
  MajorFactors: majorFactorsIW,
  // OverallTrends: viTrendIW,
};

export { correlationIW, viTrendIW, monotonicityIW };
