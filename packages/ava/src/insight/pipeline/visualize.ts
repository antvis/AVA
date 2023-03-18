import { groupBy, omit } from 'lodash';

import generateInsightNarrative from '../narrative';
import {
  ChartType,
  HomogeneousPatternInfo,
  InsightInfo,
  PatternInfo,
  VisualizationOptions,
  VisualizationSpec,
} from '../types';
import { generateInsightChartSpec } from '../chart';
import { ChartTypeMap } from '../chart/constants';

export const generateInsightVisualizationSpec = (
  insight: InsightInfo<PatternInfo>,
  visualizationOptions: VisualizationOptions
): VisualizationSpec[] => {
  const { patterns } = insight;
  const specs: VisualizationSpec[] = [];

  const patternGroups = groupBy(patterns, (pattern) => pattern.type);

  Object.entries(patternGroups).forEach(([chartType, patternGroup]: [string, PatternInfo[]]) => {
    const chartSpec = generateInsightChartSpec(insight, patternGroup);
    specs.push({
      chartType: chartType as ChartType,
      chartSpec,
      narrativeSpec: generateInsightNarrative({ ...insight, patterns: patternGroup }, visualizationOptions),
    });
  });
  return specs;
};

export const generateHomogeneousInsightVisualizationSpec = (
  insight: InsightInfo<HomogeneousPatternInfo>,
  visualizationOptions: VisualizationOptions
): VisualizationSpec[] => {
  const { patterns } = insight;
  const schemas: VisualizationSpec[] = [];
  patterns.forEach((pattern) => {
    const { insightType } = pattern;
    const chartType = ChartTypeMap[insightType];
    const chartSpec = {};
    schemas.push({
      chartType,
      chartSpec,
      narrativeSpec: generateInsightNarrative({ ...omit(insight, ['patterns']), ...pattern }, visualizationOptions),
    });
  });
  return schemas;
};
