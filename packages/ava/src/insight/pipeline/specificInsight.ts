import { size } from 'lodash';

import {
  generateInsightChartSpec,
  changePointAugmentedMarksStrategy,
  trendAugmentedMarksStrategy,
  timeSeriesOutlierStrategyAugmentedMarksStrategy,
  AugmentedMarks,
  lowVarianceAugmentedMarkStrategy,
  categoryOutlierAugmentedMarksStrategy,
} from '../chart';
import { insightPatternsExtractor } from '../insights';
import {
  InsightInfo,
  InsightType,
  PatternInfo,
  PatternInfo2InsightInfoProps,
  SpecificInsightProps,
  SpecificInsightResult,
  TimeSeriesOutlierInfo,
} from '../types';
import generateInsightNarrative from '../narrative';
import { pickValidPattern, pickValidTimeSeriesOutlierPatterns } from '../insights/util';

export const patternInfo2InsightInfo = (props: PatternInfo2InsightInfoProps): SpecificInsightResult => {
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
  const { type: insightType } = insightInfo.patterns[0] ?? {};

  const insightType2AugmentedMarks = {
    trend: trendAugmentedMarksStrategy,
    change_point: changePointAugmentedMarksStrategy,
    time_series_outlier: timeSeriesOutlierStrategyAugmentedMarksStrategy,
    low_variance: lowVarianceAugmentedMarkStrategy,
    category_outlier: categoryOutlierAugmentedMarksStrategy,
  };
  return insightType2AugmentedMarks[insightType]?.(insightInfo);
};

export const filterValidInsightInfoForAnnotationSpec = ({
  patternInfos = [],
  insightType,
}: {
  patternInfos: PatternInfo[];
  insightType: InsightType;
}) => {
  if (insightType === 'time_series_outlier')
    return pickValidTimeSeriesOutlierPatterns(patternInfos as TimeSeriesOutlierInfo[]);
  return pickValidPattern(patternInfos);
};

export const getSpecificInsight = (props: SpecificInsightProps): SpecificInsightResult => {
  const { options = {}, insightType } = props;
  const { visualizationOptions = { lang: 'zh-CN' } } = options;
  const patternInfos = insightPatternsExtractor(props);
  const validPatternInfos = filterValidInsightInfoForAnnotationSpec({ patternInfos, insightType });
  const totalInsightInfo = patternInfo2InsightInfo({ ...props, patternInfos });

  if (size(validPatternInfos)) {
    const validInsightInfo = patternInfo2InsightInfo({ ...props, patternInfos: validPatternInfos });
    const annotationSpec = getAnnotationSpec(validInsightInfo);
    const chartSpec = generateInsightChartSpec(validInsightInfo);
    const narrativeSpec = generateInsightNarrative(validInsightInfo, visualizationOptions);
    return {
      ...totalInsightInfo,
      visualizationSpecs: [
        {
          annotationSpec,
          chartSpec,
          patternType: props.insightType,
          narrativeSpec,
        },
      ],
    };
  }

  return { ...totalInsightInfo };
};
