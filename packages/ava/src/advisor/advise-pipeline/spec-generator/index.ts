import { CHART_IDS } from '../../../ckb';

import {
  pieChart,
  donutChart,
  lineChart,
  stepLineChart,
  areaChart,
  stackedAreaChart,
  percentStackedAreaChart,
  barChart,
  groupedBarChart,
  stackedBarChart,
  percentStackedBarChart,
  columnChart,
  groupedColumnChart,
  stackedColumnChart,
  percentStackedColumnChart,
  scatterPlot,
  bubbleChart,
  heatmap,
  histogram,
} from './charts';

import type { Data } from '../../../common/types';
import type { ChartKnowledge } from '../../../ckb';
import type { BasicDataPropertyForAdvice } from '../../ruler';

declare type ChartID = (typeof CHART_IDS)[number];

/**
 * Convert chartType + data to antv-spec
 * recommend chart with specific data mapping
 *
 * @param chartType chart type
 * @param data input data [ { col1: ..., col2: ... } ]
 * @param dataProps data property for advisor derived by data
 * @param chartKnowledge chart knowledge of a singble chart
 * @returns spec or null
 */
export function getChartTypeSpec(
  chartType: string,
  data: Data,
  dataProps: BasicDataPropertyForAdvice[],
  chartKnowledge?: ChartKnowledge
) {
  // step 0: check whether the chartType is default in `ChartID`
  // if not, use customized `toSpec` function
  if (!CHART_IDS.includes(chartType as ChartID) && chartKnowledge) {
    if (chartKnowledge.toSpec) {
      const spec = chartKnowledge.toSpec(data, dataProps);
      return spec;
    }
    return null;
  }
  switch (chartType) {
    // pie
    case 'pie_chart':
      return pieChart(data, dataProps);
    case 'donut_chart':
      return donutChart(data, dataProps);
    // line
    case 'line_chart':
      return lineChart(data, dataProps);
    case 'step_line_chart':
      return stepLineChart(data, dataProps);
    // area
    case 'area_chart':
      return areaChart(data, dataProps);
    case 'stacked_area_chart':
      return stackedAreaChart(data, dataProps);
    case 'percent_stacked_area_chart':
      return percentStackedAreaChart(data, dataProps);
    // bar
    case 'bar_chart':
      return barChart(data, dataProps);
    case 'grouped_bar_chart':
      return groupedBarChart(data, dataProps);
    case 'stacked_bar_chart':
      return stackedBarChart(data, dataProps);
    case 'percent_stacked_bar_chart':
      return percentStackedBarChart(data, dataProps);
    // column
    case 'column_chart':
      return columnChart(data, dataProps);
    case 'grouped_column_chart':
      return groupedColumnChart(data, dataProps);
    case 'stacked_column_chart':
      return stackedColumnChart(data, dataProps);
    case 'percent_stacked_column_chart':
      return percentStackedColumnChart(data, dataProps);
    // scatter
    case 'scatter_plot':
      return scatterPlot(data, dataProps);
    // bubble
    case 'bubble_chart':
      return bubbleChart(data, dataProps);
    // histogram
    case 'histogram':
      return histogram(data, dataProps);
    case 'heatmap':
      return heatmap(data, dataProps);
    // TODO other case 'kpi_panel' & 'table'
    // // FIXME kpi_panel and table spec to be null temporarily
    // const customChartType = ['kpi_panel', 'table'];
    // if (!customChartType.includes(t) && !chartTypeSpec) return { type: t, spec: null, score };
    default:
      return null;
  }
}
