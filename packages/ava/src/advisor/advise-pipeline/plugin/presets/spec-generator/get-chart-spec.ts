import { isFunction } from 'lodash';

import { CHART_IDS } from '../../../../../ckb';

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

import type { Data } from '../../../../../common/types';
import type { ChartId, ChartKnowledge } from '../../../../../ckb';
import type { BasicDataPropertyForAdvice } from '../../../../ruler';
import type { Advice, ChartEncodeMapping } from '../../../../types';

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
export function getChartTypeSpec({
  chartType,
  data,
  dataProps,
  encode,
  chartKnowledge,
}: {
  chartType: string;
  data: Data;
  dataProps: BasicDataPropertyForAdvice[];
  encode?: ChartEncodeMapping;
  chartKnowledge?: ChartKnowledge;
}): Advice['spec'] {
  if (isFunction(chartKnowledge.toSpec)) {
    const spec = chartKnowledge.toSpec(data, dataProps, encode);
    return spec;
  }

  if (!CHART_IDS.includes(chartType as ChartId)) {
    return null;
  }

  switch (chartType) {
    // pie
    case 'pie_chart':
      return pieChart({ data, dataProps, encode });
    case 'donut_chart':
      return donutChart({ data, dataProps, encode });
    // line
    case 'line_chart':
      return lineChart({ data, dataProps, encode });
    case 'step_line_chart':
      return stepLineChart({ data, dataProps, encode });
    // area
    case 'area_chart':
      return areaChart({ data, dataProps, encode });
    case 'stacked_area_chart':
      return stackedAreaChart({ data, dataProps, encode });
    case 'percent_stacked_area_chart':
      return percentStackedAreaChart({ data, dataProps, encode });
    // bar
    case 'bar_chart':
      return barChart({ data, dataProps, encode });
    case 'grouped_bar_chart':
      return groupedBarChart({ data, dataProps, encode });
    case 'stacked_bar_chart':
      return stackedBarChart({ data, dataProps, encode });
    case 'percent_stacked_bar_chart':
      return percentStackedBarChart({ data, dataProps, encode });
    // column
    case 'column_chart':
      return columnChart({ data, dataProps, encode });
    case 'grouped_column_chart':
      return groupedColumnChart({ data, dataProps, encode });
    case 'stacked_column_chart':
      return stackedColumnChart({ data, dataProps, encode });
    case 'percent_stacked_column_chart':
      return percentStackedColumnChart({ data, dataProps, encode });
    // scatter
    case 'scatter_plot':
      return scatterPlot({ data, dataProps, encode });
    // bubble
    case 'bubble_chart':
      return bubbleChart({ data, dataProps, encode });
    // histogram
    case 'histogram':
      return histogram({ data, dataProps, encode });
    case 'heatmap':
      return heatmap({ data, dataProps, encode });
    // TODO other case 'kpi_panel' & 'table'
    // // FIXME kpi_panel and table spec to be null temporarily
    // const customChartType = ['kpi_panel', 'table'];
    // if (!customChartType.includes(t) && !chartTypeSpec) return { type: t, spec: null, score };
    default:
      return null;
  }
}
