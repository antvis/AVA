import { RowData } from '@antv/dw-transform';

const tuple = <T extends string[]>(...args: T) => args;

const INSIGHT_TYPES = tuple(
  'MajorFactors',
  'CategoryOutliers',
  'TimeSeriesOutliers',
  'OverallTrends',
  'Seasonality',
  'Correlation',
  'ChangePoints'
  // ...
);
type InsightType = typeof INSIGHT_TYPES[number];

export interface Insight {
  type: InsightType;
  fields: string[];
  // ...
}

export function insightsFromData(data: RowData): Insight[] {
  console.log(data);
  return [{ type: 'CategoryOutliers', fields: ['a'] }];
}
