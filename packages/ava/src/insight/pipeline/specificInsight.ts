import {
  generateInsightChartSpec,
  changePointAugmentedMarksStrategy,
  trendAugmentedMarksStrategy,
  timeSeriesOutlierStrategyAugmentedMarksStrategy,
  AugmentedMarks,
} from '../chart';
import { insightPatternsExtractor } from '../insights';
import {
  InsightInfo,
  PatternInfo,
  PatternInfo2InsightInfoProps,
  SpecificInsightProps,
  SpecificInsightResult,
} from '../types';
import generateInsightNarrative from '../narrative';

export const patternInfo2InsightInfo = (
  props: PatternInfo2InsightInfoProps
): Omit<InsightInfo<PatternInfo>, 'score'> => {
  const { dimensions, measures, data, patternInfos } = props;
  return {
    subspace: [],
    dimensions,
    measures,
    patterns: patternInfos,
    data,
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

export const getSpecificInsight = (props: SpecificInsightProps): SpecificInsightResult => {
  const { visualizationOptions } = props.options || {};
  const patternInfos = insightPatternsExtractor(props);
  const insightInfo = patternInfo2InsightInfo({ ...props, patternInfos });
  const annotationSpec = getAnnotationSpec(insightInfo);
  const chartSpec = generateInsightChartSpec(insightInfo);
  const narrativeSpec = generateInsightNarrative(insightInfo, visualizationOptions);

  return {
    ...insightInfo,
    visualizationSpecs: [
      {
        annotationSpec,
        chartSpec,
        patternType: props.insightType,
        narrativeSpec,
      },
    ],
  };
};
