import _groupBy from 'lodash/groupBy';
import { ChartType, HomogeneousPatternInfo, InsightInfo, InsightType, PatternInfo, VisualizationSchema } from '../interface';
import { generateInsightAnnotationConfig, generateHomogeneousInsightAnnotationConfig } from './annotation';
import { generateInsightDescription, generateHomogeneousInsightDescription } from './description';

export const ChartTypeMap: Record<InsightType, ChartType> = {
  category_outlier: 'column_chart',
  trend: 'line_chart',
  change_point: 'line_chart',
  time_series_outlier: 'line_chart',
  majority: 'pie_chart',
};

export const getInsightVisualizationSchema = (insight: InsightInfo<PatternInfo>): VisualizationSchema[] => {
  const { breakdowns, patterns, measures } = insight;

  const schemas: VisualizationSchema[] = [];

  const patternGroups = _groupBy(patterns, (pattern) => ChartTypeMap[pattern.type] as ChartType);

  Object.entries(patternGroups).forEach(([chartType, patternGroup]: [string, PatternInfo[]]) => {
    const { caption, insightSummary } = generateInsightDescription(patterns, insight);

    // TODO chart schema generation
    const plotSchema = {
      [chartType === 'pie_chart' ? 'colorField' : 'xField']: breakdowns[0],
      [chartType === 'pie_chart' ? 'angleField' : 'yField']: measures[0].field,
    };
    const annotationConfig = generateInsightAnnotationConfig(patternGroup);

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
/** lowlight information that does not require attention */
const lowlight = (pattern: HomogeneousPatternInfo, colorField: string) => {
  const { type, insightType, commSet, exc = [] } = pattern;
  const chartType = ChartTypeMap[insightType];
  let highlightSet: string[] = [];
  if (type === 'commonness') {
    highlightSet = commSet;
  } else if (type === 'exception') {
    highlightSet = exc;
  }
  const opacity = (value: string) => highlightSet.includes(value) ? 1 : 0.2;
  if (chartType === 'line_chart') {
    return {
      lineStyle: (data) => {
        return {
          opacity: opacity(data[colorField]),
        };
      },
    };
  }
  if (chartType === 'column_chart') {
    return {
      columnStyle: (data) => {
        return {
          fillOpacity: opacity(data[colorField]),
        };
      },
    };
  }
  return {};
};

export const getHomogeneousInsightVisualizationSchema = (insight: InsightInfo<HomogeneousPatternInfo>): VisualizationSchema[] => {
  const { breakdowns, patterns, measures } = insight;

  const schemas: VisualizationSchema[] = [];

  const { caption, insightSummary } = generateHomogeneousInsightDescription(insight);
  patterns.forEach((pattern) => {
    const { insightType } = pattern;
    // TODO chart schema generation
    const chartType = ChartTypeMap[insightType];
    let plotSchema;
    if (measures.length > 1) {
      plotSchema = {
        xField: breakdowns[0],
        yField: 'value',
        seriesField: 'measureName',
      };
    } else {
      plotSchema = {
        xField: breakdowns[1],
        yField: measures[0].field,
        seriesField: breakdowns[0],
      };
    }

    const style = lowlight(pattern, plotSchema.seriesField);
    const annotationConfig = generateHomogeneousInsightAnnotationConfig(pattern);

    const chartSchema = {
      ...plotSchema,
      ...style,
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
