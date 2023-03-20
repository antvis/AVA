import { groupBy, omit } from 'lodash';

import generateInsightNarrative from '../narrative';
import {
  InsightType,
  HomogeneousPatternInfo,
  InsightInfo,
  PatternInfo,
  VisualizationOptions,
  VisualizationSpec,
} from '../types';
import { generateInsightChartSpec } from '../chart';

export const generateInsightVisualizationSpec = (
  insight: InsightInfo<PatternInfo>,
  visualizationOptions: VisualizationOptions = {
    lang: 'en-US',
  }
): VisualizationSpec[] => {
  const { patterns } = insight;
  const specs: VisualizationSpec[] = [];

  const patternGroups = groupBy(patterns, (pattern) => pattern.type);

  Object.entries(patternGroups).forEach(([patternType, patternGroup]: [string, PatternInfo[]]) => {
    const chartSpec = generateInsightChartSpec({ ...insight, patterns: patternGroup });
    specs.push({
      patternType: patternType as InsightType,
      chartSpec,
      narrativeSpec: generateInsightNarrative({ ...insight, patterns: patternGroup }, visualizationOptions),
    });
  });
  return specs;
};

export const generateHomogeneousInsightVisualizationSpec = (
  insight: InsightInfo<HomogeneousPatternInfo>,
  visualizationOptions: VisualizationOptions = {
    lang: 'en-US',
  }
): VisualizationSpec[] => {
  const { patterns } = insight;
  const schemas: VisualizationSpec[] = [];
  patterns.forEach((pattern) => {
    const { insightType } = pattern;
    const chartSpec = {};
    schemas.push({
      patternType: insightType,
      chartSpec,
      narrativeSpec: generateInsightNarrative({ ...omit(insight, ['patterns']), ...pattern }, visualizationOptions),
    });
  });
  return schemas;
};
