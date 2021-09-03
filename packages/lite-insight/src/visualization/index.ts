import _groupBy from 'lodash/groupBy';
import { ChartType, HomogeneousPatternInfo, InsightInfo, InsightType, PatternInfo } from '../interface';
import { generateInsightAnnotationConfig, generateHomogeneousInsightAnnotationConfig } from './annotation';
import { generateInsightDescription, generateHomogeneousInsightDescription } from './description';

export const ChartTypeMap: Record<InsightType, ChartType> = {
  category_outlier: 'column_chart',
  trend: 'line_chart',
  change_point: 'line_chart',
  time_series_outlier: 'line_chart',
};

export const getInsightVisualizationSchema = (insight: InsightInfo<PatternInfo>) => {
  const { breakdowns, patterns, measures } = insight;

  const schemas = [];

  const patternGroups = _groupBy(patterns, (pattern) => ChartTypeMap[pattern.type] as ChartType);

  Object.entries(patternGroups).forEach(([chartType, patternGroup]: [ChartType, PatternInfo[]]) => {
    const { caption, insightSummary } = generateInsightDescription(patterns, insight);

    // TODO chart schema generation
    const plotSchema = {
      xField: breakdowns[0],
      yField: measures[0].field,
    };
    const annotationConfig = generateInsightAnnotationConfig(patternGroup);

    const chartSchema = {
      ...plotSchema,
      annotations: annotationConfig,
    };
    schemas.push({
      chartType,
      chartSchema,
      caption,
      insightSummary,
    });
  });

  return schemas;
};

export const getHomogeneousInsightVisualizationSchema = (insight: InsightInfo<HomogeneousPatternInfo>) => {
  const { breakdowns, patterns, measures } = insight;

  const schemas = [];

  const { childPatterns } = patterns[0];

  const { caption, insightSummary } = generateHomogeneousInsightDescription(insight);

  // TODO chart schema generation
  if (measures.length > 1) {
    const plotSchema = {
      xField: breakdowns[0],
      yField: 'value',
      seriesField: 'measureName',
    };
    const annotationConfig = generateHomogeneousInsightAnnotationConfig(childPatterns);

    const chartSchema = {
      ...plotSchema,
      annotations: annotationConfig,
    };
    schemas.push({
      chartType: ChartTypeMap[patterns[0].insightType],
      chartSchema,
      caption,
      insightSummary,
    });
  } else {
    const plotSchema = {
      xField: breakdowns[1],
      yField: measures[0].field,
      seriesField: breakdowns[0],
    };
    // const annotationConfig = generateHomogeneousInsightAnnotationConfig(childPatterns);

    const chartSchema = {
      ...plotSchema,
      // annotations: annotationConfig,
    };
    schemas.push({
      chartType: ChartTypeMap[patterns[0].insightType],
      chartSchema,
      caption,
      insightSummary,
    });
  }
  return schemas;
};
