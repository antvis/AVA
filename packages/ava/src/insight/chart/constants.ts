import { ChartType, InsightType } from '../types';

export const INSIGHT_COLOR_PLATTE: Record<string, string> = {
  highlight: '#E09322',
  outlier: '#CB5140',
  font: '#2C3542',
  defaultPointColor: '#fff',
} as const;

export const BOLD_FONT_WEIGHT = 500;

export const TEXT_STYLE = {
  textAlign: 'center',
  fill: INSIGHT_COLOR_PLATTE.font,
  opacity: 0.65,
};

export const ChartTypeMap: Record<InsightType, ChartType> = {
  category_outlier: 'column_chart',
  trend: 'line_chart',
  change_point: 'line_chart',
  time_series_outlier: 'line_chart',
  majority: 'pie_chart',
  low_variance: 'column_chart',
  correlation: 'scatter_plot',
};
