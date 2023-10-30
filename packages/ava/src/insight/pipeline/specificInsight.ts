import { G2Spec, Mark } from '@antv/g2';
import { zipObject } from 'lodash';

import { changePointAugmentedMarksStrategy, generateInsightChartSpec, trendAugmentedMarksStrategy } from '../chart';
import { timeSeriesOutlierStrategyAugmentedMarksStrategy } from '../chart/strategy/augmentedMarks/timeSeriesOutlier';
import { IMPACT_SCORE_WEIGHT } from '../constant';
import { insightPatternsExtractor } from '../insights';
import { InsightInfo, PatternInfo, PatternInfo2InsightInfoProps, SpecificInsightProps } from '../types';

export const patternInfo2InsightInfo = (props: PatternInfo2InsightInfoProps) => {
  const { dimensions, measures, data, patternInfos } = props;
  const score = patternInfos[0] ? patternInfos[0].significance * (1 - IMPACT_SCORE_WEIGHT) + IMPACT_SCORE_WEIGHT : 0;
  return {
    subspace: [],
    dimensions: [
      {
        fieldName: dimensions[0],
      },
    ],
    measures,
    patterns: patternInfos,
    data,
    score,
  };
};

export const getAnnotationSpec = (insightInfo: InsightInfo<PatternInfo>): Record<string, G2Spec> => {
  const { type: insightType } = insightInfo.patterns[0];

  const insightType2AugmentedMarks = {
    trend: trendAugmentedMarksStrategy,
    change_point: changePointAugmentedMarksStrategy,
    time_series_outlier: timeSeriesOutlierStrategyAugmentedMarksStrategy,
  };
  const markList = insightType2AugmentedMarks[insightType]?.(insightInfo) as Mark[];
  const markMap = zipObject(
    markList.map((mark) => mark.type as string),
    markList
  );
  return markMap;
};

export const getSpecificInsight = (props: SpecificInsightProps): InsightInfo<PatternInfo> => {
  // 计算patternInfo
  const patternInfos = insightPatternsExtractor(props);
  // 获取insightInfo
  const insightInfo = patternInfo2InsightInfo({ ...props, patternInfos });
  // 获取annotationSpec
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
