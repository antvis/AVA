import { G2Spec } from '@antv/g2';

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
} from '../strategy';
import { LineMarkConfig, PointMarkConfig, TextMarkConfig } from '../types';

export function generateInsightAugmentedMarks(
  patternGroup: PatternInfo[],
  markStyleConfig?: TextMarkConfig | LineMarkConfig | PointMarkConfig
): G2Spec {
  const { type: insightType } = patternGroup[0];

  const insightType2Strategy: Record<
    string,
    (patternGroup: PatternInfo[], markStyleConfig?: TextMarkConfig | LineMarkConfig | PointMarkConfig) => G2Spec
  > = {
    trend: trendAugmentedMarksStrategy,
    category_outlier: categoryOutlierAugmentedMarksStrategy,
    change_point: changePointAugmentedMarksStrategy,
    low_variance: lowVarianceAugmentedMarkStrategy,
  };

  const chartSpec: G2Spec = insightType2Strategy[insightType]?.(patternGroup, markStyleConfig);
  return chartSpec;
}

export function generateInsightChartSpec(insight: InsightInfo<PatternInfo>, patternGroup: PatternInfo[]): G2Spec {
  const { type: insightType } = patternGroup[0];

  const insightType2Strategy: Record<string, (insight: InsightInfo<PatternInfo>, patterns: PatternInfo[]) => G2Spec> = {
    trend: trendStrategy,
    time_series_outlier: timeSeriesOutlierStrategy,
    category_outlier: categoryOutlierStrategy,
    change_point: changePointStrategy,
    low_variance: lowVarianceStrategy,
    majority: majorityStrategy,
    correlation: correlationStrategy,
  };

  const chartSpec: G2Spec = insightType2Strategy[insightType]?.(insight, patternGroup);
  return chartSpec;
}
