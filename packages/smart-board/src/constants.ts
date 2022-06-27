import { InsightType } from './types';

export const INSIGHT_TYPES: InsightType[] = [
  'category_outlier',
  'trend',
  'change_point',
  'time_series_outlier',
  'majority',
  'low_variance',
  'correlation',
];

export const G2PLOT_TYPES = {
  default: 'Line',
  line_chart: 'Line',
  column_chart: 'Column',
  grouped_column_chart: 'Column',
  stack_column_chart: 'Column',
  pie_chart: 'Pie',
  bar_chart: 'Bar',
  area_chart: 'Area',
  histogram: 'Histogram',
  scatter_plot: 'Scatter',
  heatmap: 'Heatmap',
};

export const MIN_DIFF_THRESHOLD = 0.0000001;
