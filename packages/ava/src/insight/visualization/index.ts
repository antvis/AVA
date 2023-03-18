import { groupBy, get } from 'lodash';

import {
  ChartType,
  HomogeneousPatternInfo,
  InsightInfo,
  PatternInfo,
  VisualizationSpec,
  InsightOptions,
  VisualizationOptions,
  InsightType,
} from '../types';
import { InsightNarrativeGenerator, HomogeneousNarrativeGenerator } from '../narrative';

import { generateInsightAnnotationConfigs, generateHomogeneousInsightAnnotationConfig } from './strategy/annotations';

const ChartTypeMap: Record<InsightType, ChartType> = {
  category_outlier: 'column_chart',
  trend: 'line_chart',
  change_point: 'line_chart',
  time_series_outlier: 'line_chart',
  majority: 'pie_chart',
  low_variance: 'column_chart',
  correlation: 'scatter_plot',
};

export function getInsightVisualizationSpec(
  insight: InsightInfo<PatternInfo>,
  visualizationOptions: InsightOptions['visualization']
): VisualizationSpec[] {
  const { dimensions, patterns, measures } = insight;

  const specs: VisualizationSpec[] = [];
  const summaryType = get(visualizationOptions, 'summaryType', 'text') as VisualizationOptions['summaryType'];

  const patternGroups = groupBy(patterns, (pattern) => ChartTypeMap[pattern.type] as ChartType);

  Object.entries(patternGroups).forEach(([chartType, patternGroup]: [string, PatternInfo[]]) => {
    const narrative = new InsightNarrativeGenerator(patterns, insight);

    const plotSpec = {
      [chartType === 'pie_chart' ? 'colorField' : 'xField']:
        chartType === 'scatter_plot' ? measures[1].fieldName : dimensions[0],
      [chartType === 'pie_chart' ? 'angleField' : 'yField']: measures[0].fieldName,
    };
    const annotationConfigs = generateInsightAnnotationConfigs(patternGroup);

    const chartSpec = {
      ...plotSpec,
      ...annotationConfigs,
    };
    specs.push({
      chartType: chartType as ChartType,
      chartSpec: chartSpec,
      // @ts-ignore TODO @yuxi modify ntv generator and put caption into narrativeSpec
      narrativeSpec:
        summaryType === 'spec'
          ? narrative.summaries?.map((i) => i.getSpec())
          : narrative.summaries?.map((i) => i.getContent()),
    });
  });

  return specs;
}

/** lowlight information that does not require attention */
function lowlight(pattern: HomogeneousPatternInfo, colorField: string) {
  const { type, insightType, commonSet, exceptions = [] } = pattern;
  const chartType = ChartTypeMap[insightType];
  let highlightSet: string[] = [];
  if (type === 'commonness') {
    highlightSet = commonSet;
  } else if (type === 'exception') {
    highlightSet = exceptions;
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
}

export function getHomogeneousInsightVisualizationSpec(
  insight: InsightInfo<HomogeneousPatternInfo>,
  visualizationOptions: InsightOptions['visualization']
): VisualizationSpec[] {
  const { dimensions, patterns, measures } = insight;

  const specs: VisualizationSpec[] = [];
  const summaryType = get(visualizationOptions, 'summaryType', 'text') as VisualizationOptions['summaryType'];
  const { summary } = new HomogeneousNarrativeGenerator(insight.patterns, insight);

  patterns.forEach((pattern) => {
    const { insightType } = pattern;
    const chartType = ChartTypeMap[insightType];

    let plotSpec;
    if (measures.length > 1) {
      plotSpec = {
        xField: dimensions[0],
        yField: 'value',
        seriesField: 'measureName',
      };
    } else {
      plotSpec = {
        xField: dimensions[1],
        yField: measures[0].fieldName,
        seriesField: dimensions[0],
      };
    }

    const style = lowlight(pattern, plotSpec.seriesField);
    const annotationConfig = generateHomogeneousInsightAnnotationConfig(pattern);

    const chartSpec = {
      ...plotSpec,
      ...style,
      annotations: annotationConfig,
    };
    specs.push({
      chartType,
      chartSpec: chartSpec,
      // @ts-ignore TODO @yuxi modify ntv generator and put caption into narrativeSpec
      narrativeSpec: summaryType === 'spec' ? [summary.getSpec()] : [summary.getContent()],
    });
  });

  return specs;
}
