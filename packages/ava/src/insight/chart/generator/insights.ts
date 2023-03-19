import { G2Spec, Mark } from '@antv/g2';

import { InsightInfo, PatternInfo } from '../../types';
import {
  categoryOutlierStrategy,
  changePointStrategy,
  lowVarianceStrategy,
  majorityStrategy,
  correlationStrategy,
  timeSeriesOutlierStrategy,
  trendStrategy,
  trendAugmentedMarksStrategy,
  categoryOutlierAugmentedMarksStrategy,
  changePointAugmentedMarksStrategy,
  lowVarianceAugmentedMarkStrategy,
  viewSpecStrategy,
} from '../strategy';
import { LineMarkConfig, PointMarkConfig, TextMarkConfig } from '../types';

export function generateInsightAugmentedMarks(
  patternGroup: PatternInfo[],
  markStyleConfig?: TextMarkConfig | LineMarkConfig | PointMarkConfig
): G2Spec {
  const { type: insightType } = patternGroup[0];

  const insightType2Strategy: Record<
    string,
    (patternGroup: PatternInfo[], markStyleConfig?: TextMarkConfig | LineMarkConfig | PointMarkConfig) => Mark[]
  > = {
    // @ts-ignore The generateInsightAugmentedMarks needs to be refactored, it's not exported now.
    trend: trendAugmentedMarksStrategy,
    category_outlier: categoryOutlierAugmentedMarksStrategy,
    change_point: changePointAugmentedMarksStrategy,
    low_variance: lowVarianceAugmentedMarkStrategy,
  };

  const augmentedMarks = insightType2Strategy[insightType]?.(patternGroup, markStyleConfig);
  return augmentedMarks;
}

export function generateInsightChartSpec(insight: InsightInfo<PatternInfo>, patternGroup: PatternInfo[]): G2Spec {
  const { type: insightType } = patternGroup[0];

  const insightType2Strategy: Record<string, (insight: InsightInfo<PatternInfo>, patterns: PatternInfo[]) => Mark[]> = {
    trend: trendStrategy,
    time_series_outlier: timeSeriesOutlierStrategy,
    category_outlier: categoryOutlierStrategy,
    change_point: changePointStrategy,
    low_variance: lowVarianceStrategy,
    majority: majorityStrategy,
    correlation: correlationStrategy,
  };

  const marks = insightType2Strategy[insightType]?.(insight, patternGroup);
  return viewSpecStrategy(marks);
}
