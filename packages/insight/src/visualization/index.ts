import _groupBy from 'lodash/groupBy';
import { ChartType, InsightInfo, InsightType, PatternInfo, VisualizationSchema } from '../interface';
import { generateInsightAnnotationConfig } from './annotation';
import { generateInsightDescription } from './description';

export const ChartTypeMap: Record<InsightType, ChartType> = {
  category_outlier: 'column_chart',
  trend: 'line_chart',
  change_point: 'line_chart',
  time_series_outlier: 'line_chart',
};

export const getInsightVisualizationSchema = (insight: InsightInfo) => {
  const { breakdowns, patterns, measures } = insight;

  const schemas: VisualizationSchema[] = [];

  const patternGroups = _groupBy(patterns, (pattern) => ChartTypeMap[pattern.type]);

  Object.entries(patternGroups).forEach(([chartType, patternGroup]: [string, PatternInfo[]]) => {
    const { caption, insightSummary } = generateInsightDescription(patterns, insight);

    // TODO chart schema generation
    const plotSchema = {
      xField: breakdowns[0],
      yField: measures[0].field,
    };
    const annotationConfig = generateInsightAnnotationConfig(patternGroup, insight);

    const chartSchema = {
      ...plotSchema,
      annotations: annotationConfig,
    };
    schemas.push({
      chartType: chartType as ChartType,
      chartSchema,
      caption,
      insightSummary,
    });
  });

  return schemas;
};
