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
} from '../strategy';

export function generateInsightVisualizationSpec(
  insight: InsightInfo<PatternInfo>,
  patternGroup: PatternInfo[]
): G2Spec {
  const { type: insightType } = patternGroup[0];

  const insightType2Strategy: Record<string, (insight: InsightInfo<PatternInfo>) => G2Spec> = {
    trend: trendStrategy,
    time_series_outlier: timeSeriesOutlierStrategy,
    category_outlier: categoryOutlierStrategy,
    change_point: changePointStrategy,
    low_variance: lowVarianceStrategy,
    majority: majorityStrategy,
    correlation: correlationStrategy,
  };

  // use any for using different strategy for different insight type
  const chartSpec: G2Spec = insightType2Strategy[insightType]?.(insight);
  return chartSpec;
}
