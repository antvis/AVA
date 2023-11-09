import {
  generateInsightChartSpec,
  changePointAugmentedMarksStrategy,
  trendAugmentedMarksStrategy,
  timeSeriesOutlierStrategyAugmentedMarksStrategy,
} from '../chart';
import { IMPACT_SCORE_WEIGHT } from '../constant';
import { insightPatternsExtractor } from '../insights';
import { InsightInfo, PatternInfo, PatternInfo2InsightInfoProps, SpecificInsightProps } from '../types';
import { AugmentedMarks } from '../chart/types';

export const patternInfo2InsightInfo = (props: PatternInfo2InsightInfoProps) => {
  const { dimensions, measures, data, patternInfos } = props;
  const score = patternInfos[0] ? patternInfos[0].significance * (1 - IMPACT_SCORE_WEIGHT) + IMPACT_SCORE_WEIGHT : 0;
  return {
    subspace: [],
    dimensions,
    measures,
    patterns: patternInfos,
    data,
    score,
  };
};

export const getAnnotationSpec = (insightInfo: InsightInfo<PatternInfo>): AugmentedMarks => {
  const { type: insightType } = insightInfo.patterns[0];

  const insightType2AugmentedMarks = {
    trend: trendAugmentedMarksStrategy,
    change_point: changePointAugmentedMarksStrategy,
    time_series_outlier: timeSeriesOutlierStrategyAugmentedMarksStrategy,
  };
  return insightType2AugmentedMarks[insightType]?.(insightInfo);
};

export const getSpecificInsight = (props: SpecificInsightProps): InsightInfo<PatternInfo> => {
  const patternInfos = insightPatternsExtractor(props);
  const insightInfo = patternInfo2InsightInfo({ ...props, patternInfos });
  const annotationSpec = getAnnotationSpec(insightInfo);
  const chartSpec = generateInsightChartSpec(insightInfo);

  return {
    ...insightInfo,
    visualizationSpecs: [
      {
        annotationSpec,
        chartSpec,
        patternType: props.insightType,
      },
    ],
  };
};
