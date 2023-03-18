import { get, groupBy } from 'lodash';

import { HomogeneousNarrativeGenerator } from '../narrative';
import {
  ChartType,
  HomogeneousPatternInfo,
  InsightInfo,
  InsightOptions,
  PatternInfo,
  VisualizationOptions,
  VisualizationSpec,
} from '../types';
import { generateInsightChartSpec } from '../chart';
import { ChartTypeMap } from '../chart/constants';

export const generateInsightVisualizationSpec = (
  insight: InsightInfo<PatternInfo>,
  visualizationOptions: InsightOptions['visualization']
): VisualizationSpec[] => {
  const { patterns } = insight;
  const schemas: VisualizationSpec[] = [];

  const patternGroups = groupBy(patterns, (pattern) => pattern.type);

  Object.entries(patternGroups).forEach(([chartType, patternGroup]: [string, PatternInfo[]]) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const summaryType = get(visualizationOptions, 'summaryType', 'text') as VisualizationOptions['summaryType'];
    // todo generate narrative spec
    const narrativeSpec = [];
    const chartSpec = generateInsightChartSpec(insight, patternGroup);
    schemas.push({
      chartType: chartType as ChartType,
      chartSpec,
      narrativeSpec,
    });
  });
  return schemas;
};

// todo: 组装 ntv spec 和 chart spec
export const generateHomogeneousInsightVisualizationSpec = (
  insight: InsightInfo<HomogeneousPatternInfo>,
  visualizationOptions: InsightOptions['visualization']
): VisualizationSpec[] => {
  const { patterns } = insight;

  const schemas: VisualizationSpec[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const summaryType = get(visualizationOptions, 'summaryType', 'text') as VisualizationOptions['summaryType'];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { summary } = new HomogeneousNarrativeGenerator(insight.patterns, insight);

  patterns.forEach((pattern) => {
    const { insightType } = pattern;
    const chartType = ChartTypeMap[insightType];
    const narrativeSpec = [];
    const chartSpec = {};
    schemas.push({
      chartType,
      chartSpec,
      narrativeSpec,
    });
  });
  return schemas;
};
