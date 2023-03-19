import { Mark } from '@antv/g2';

import { TimeSeriesOutlierInfo, InsightInfo } from '../../types';

import { insight2ChartStrategy } from './chartStrategy';

export const timeSeriesOutlierStrategyAugmentedMarksStrategy = (patterns: TimeSeriesOutlierInfo[]): Mark[] => {
  // const color = INSIGHT_COLOR_PLATTE.highlight;
  // const pointMark = pointMarkStrategy(patterns, { strokeColor: color });
  // const textMark = textMarkStrategy(patterns, { formatter: dataFormat });
  // return [pointMark, textMark];
};

export const timeSeriesOutlierStrategy = (
  insight: InsightInfo<TimeSeriesOutlierInfo>,
  patterns: TimeSeriesOutlierInfo[]
): Mark[] => {
  const chartMark = insight2ChartStrategy(insight);
  const augmentedMarks = timeSeriesOutlierStrategyAugmentedMarksStrategy(patterns);
  return [chartMark, ...augmentedMarks];
};
