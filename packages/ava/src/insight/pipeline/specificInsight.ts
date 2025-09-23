import { size } from 'lodash';
import { G2Spec } from '@antv/g2';

import {
  generateInsightChartSpec,
  changePointAugmentedMarksStrategy,
  trendAugmentedMarksStrategy,
  timeSeriesOutlierStrategyAugmentedMarksStrategy,
  lowVarianceAugmentedMarkStrategy,
  categoryOutlierAugmentedMarksStrategy,
} from '@ava/insight/chart';
import { insightPatternsExtractor } from '@ava/insight/insights';
import {
  InsightInfo,
  InsightType,
  PatternInfo,
  PatternInfo2InsightInfoProps,
  SpecificInsightProps,
  SpecificInsightResult,
  TimeSeriesOutlierInfo,
  AugmentedMarks,
} from '@ava/types';
import { pickValidPattern, pickValidTimeSeriesOutlierPatterns } from '@ava/insight/insights/util';
import { insight2ChartStrategy, viewSpecStrategy } from '@ava/insight/chart/strategy';

export const patternInfo2InsightInfo = (props: PatternInfo2InsightInfoProps): InsightInfo<PatternInfo> => {
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

export const getChartSpecWithoutAugmentedMarks = (
  insightInfo: InsightInfo<PatternInfo>,
  insightType: InsightType
): G2Spec => {
  const chartMark = insight2ChartStrategy({
    ...insightInfo,
    ...(size(insightInfo.patterns) === 0
      ? {
          patterns: [{ type: insightType }],
        }
      : {}),
  });
  return viewSpecStrategy([chartMark], insightInfo);
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
  const { insightType } = props;
  const patternInfos = insightPatternsExtractor(props);
  const validPatternInfos = filterValidInsightInfoForAnnotationSpec({ patternInfos, insightType });
  const totalInsightInfo = patternInfo2InsightInfo({ ...props, patternInfos });

  if (size(validPatternInfos)) {
    const validInsightInfo = patternInfo2InsightInfo({ ...props, patternInfos: validPatternInfos });
    const annotationSpec = getAnnotationSpec(validInsightInfo);
    const chartSpec = generateInsightChartSpec(validInsightInfo);
    // const narrativeSpec = generateInsightNarrative(validInsightInfo, visualizationOptions);
    return {
      ...totalInsightInfo,
      visualizationSpecs: [
        {
          annotationSpec,
          chartSpec,
          patternType: insightType,
          // narrativeSpec,
        },
      ],
    };
  }

  const chartSpec = getChartSpecWithoutAugmentedMarks(totalInsightInfo, insightType);

  return {
    ...totalInsightInfo,
    visualizationSpecs: [
      {
        chartSpec,
        patternType: insightType,
      },
    ],
  };
};
