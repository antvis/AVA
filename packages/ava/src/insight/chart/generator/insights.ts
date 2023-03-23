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

// The generateInsightAugmentedMarks needs to be refactored, it's not exported now.
export function generateInsightAugmentedMarks(
  insight: InsightInfo<PatternInfo>,
  markStyleConfig?: TextMarkConfig | LineMarkConfig | PointMarkConfig
): G2Spec {
  const { type: insightType } = insight?.patterns[0];

  const insightType2Strategy: Record<
    string,
    (insight: InsightInfo<PatternInfo>, markStyleConfig?: TextMarkConfig | LineMarkConfig | PointMarkConfig) => Mark[]
  > = {
    trend: trendAugmentedMarksStrategy,
    category_outlier: categoryOutlierAugmentedMarksStrategy,
    change_point: changePointAugmentedMarksStrategy,
    low_variance: lowVarianceAugmentedMarkStrategy,
  };

  const augmentedMarks = insightType2Strategy[insightType]?.(insight, markStyleConfig);
  return augmentedMarks;
}

export function generateInsightChartSpec(insight: InsightInfo<PatternInfo>): G2Spec {
  const { type: insightType } = insight.patterns[0];

  const insightType2Strategy: Record<string, (insight: InsightInfo<PatternInfo>) => Mark[]> = {
    trend: trendStrategy,
    time_series_outlier: timeSeriesOutlierStrategy,
    category_outlier: categoryOutlierStrategy,
    change_point: changePointStrategy,
    low_variance: lowVarianceStrategy,
    majority: majorityStrategy,
    correlation: correlationStrategy,
  };

  // majority insight pattern visualizes as 'pie', should not use y nice (G2 handle it as rescale y, the pie chart will be less than 100%)
  const isThetaCoordinate = insight.patterns.map((pattern) => pattern.type).includes('majority');
  const viewConfig = isThetaCoordinate
    ? { scale: { y: { nice: false } } }
    : {
        scale: { y: { nice: true } },
      };
  const marks = insightType2Strategy[insightType]?.(insight);
  return viewSpecStrategy(marks, viewConfig);
}
