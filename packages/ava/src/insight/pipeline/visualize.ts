import { groupBy } from 'lodash';

import { generateInsightChartSpec } from '@ava/insight/chart';

import type {
  InsightType,
  HomogeneousPatternInfo,
  InsightInfo,
  PatternInfo,
  InsightVisualizationSpec,
} from '@ava/types';

export const generateInsightVisualizationSpec = (insight: InsightInfo<PatternInfo>): InsightVisualizationSpec[] => {
  const { patterns } = insight;
  const specs: InsightVisualizationSpec[] = [];
  if (!patterns.length) return [];

  const patternGroups = groupBy(patterns, (pattern) => pattern.type);

  Object.entries(patternGroups).forEach(([patternType, patternGroup]: [string, PatternInfo[]]) => {
    const chartSpec = generateInsightChartSpec({ ...insight, patterns: patternGroup });
    specs.push({
      patternType: patternType as InsightType,
      chartSpec,
      // todo: 后续直接引入 T8，需要重构
      // narrativeSpec: generateInsightNarrative({ ...insight, patterns: patternGroup }, visualizationOptions),
    });
  });
  return specs;
};

export const generateHomogeneousInsightVisualizationSpec = (
  insight: InsightInfo<HomogeneousPatternInfo>
): InsightVisualizationSpec[] => {
  const { patterns } = insight;
  const schemas: InsightVisualizationSpec[] = [];
  patterns.forEach((pattern) => {
    const { insightType } = pattern;
    const chartSpec = {};

    schemas.push({
      patternType: insightType,
      chartSpec,
      // narrativeSpec: generateInsightNarrative({ ...omit(insight, ['patterns']), ...pattern }, visualizationOptions),
    });
  });
  return schemas;
};
