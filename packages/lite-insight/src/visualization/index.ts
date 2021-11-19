import _groupBy from 'lodash/groupBy';
import _get from 'lodash/get';
import {
  ChartType,
  HomogeneousPatternInfo,
  InsightInfo,
  InsightType,
  PatternInfo,
  VisualizationSchema,
  InsightOptions,
} from '../interface';
import { InsightNarrativeGenerator, HomogeneousNarrativeGenerator } from '../narrative';
import { generateInsightAnnotationConfig, generateHomogeneousInsightAnnotationConfig } from './annotation';

export const ChartTypeMap: Record<InsightType, ChartType> = {
  category_outlier: 'column_chart',
  trend: 'line_chart',
  change_point: 'line_chart',
  time_series_outlier: 'line_chart',
  majority: 'pie_chart',
  low_variance: 'column_chart',
};

export const getInsightVisualizationSchema = (
  insight: InsightInfo<PatternInfo>,
  visualizationOptions: InsightOptions['visualization']
): VisualizationSchema[] => {
  const { dimensions, patterns, measures } = insight;

  const schemas: VisualizationSchema[] = [];
  const summaryType = _get(visualizationOptions, 'summaryType', 'text');

  const patternGroups = _groupBy(patterns, (pattern) => ChartTypeMap[pattern.type] as ChartType);

  Object.entries(patternGroups).forEach(([chartType, patternGroup]: [string, PatternInfo[]]) => {
    const narrative = new InsightNarrativeGenerator(patterns, insight);

    // TODO chart schema generation
    const plotSchema = {
      [chartType === 'pie_chart' ? 'colorField' : 'xField']: dimensions[0],
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
      caption: narrative.caption?.getContent(),
      insightSummaries:
        summaryType === 'schema'
          ? narrative.summaries?.map((i) => i.getSchema())
          : narrative.summaries?.map((i) => i.getContent()),
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
  const opacity = (value: string) => (highlightSet.includes(value) ? 1 : 0.2);
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

export const getHomogeneousInsightVisualizationSchema = (
  insight: InsightInfo<HomogeneousPatternInfo>,
  visualizationOptions: InsightOptions['visualization']
): VisualizationSchema[] => {
  const { dimensions, patterns, measures } = insight;

  const schemas: VisualizationSchema[] = [];
  const summaryType = _get(visualizationOptions, 'summaryType', 'text');
  const { summary } = new HomogeneousNarrativeGenerator(insight.patterns, insight);

  patterns.forEach((pattern) => {
    const { insightType } = pattern;
    // TODO chart schema generation
    const chartType = ChartTypeMap[insightType];
    let plotSchema;
    if (measures.length > 1) {
      plotSchema = {
        xField: dimensions[0],
        yField: 'value',
        seriesField: 'measureName',
      };
    } else {
      plotSchema = {
        xField: dimensions[1],
        yField: measures[0].field,
        seriesField: dimensions[0],
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
      caption: '',
      insightSummaries: summaryType === 'schema' ? [summary.getSchema()] : [summary.getContent()],
    });
  });

  return schemas;
};
