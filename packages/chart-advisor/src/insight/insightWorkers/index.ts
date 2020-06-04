import { RowData } from '@antv/dw-transform';
import { Insight } from '..';

import { correlationIW } from './correlation';
import { trendIW } from './vi-trend';

const tuple = <T extends string[]>(...args: T) => args;

export const INSIGHT_TYPES = tuple(
  'MajorFactors',
  'CategoryOutliers',
  'TimeSeriesOutliers',
  'OverallTrends',
  'Seasonality',
  'Correlation',
  'ChangePoints'
  // ...
);

export type InsightType = typeof INSIGHT_TYPES[number];

export type Worker = (data: RowData[]) => Insight[] | Promise<Insight[]>;

export const insightWorkers: Partial<Record<InsightType, Worker>> = {
  Correlation: correlationIW,
  OverallTrends: trendIW,
};

export { correlationIW, trendIW };
