// Should be confidence level. Is the SIGNIFICANCE_BENCHMARK naming correct? by @pddpd
import { ChartType, InsightType } from '@ava/types';

export const SIGNIFICANCE_BENCHMARK = 0.95;

export const SIGNIFICANCE_LEVEL = 0.05;

export const INSIGHT_SCORE_BENCHMARK = 0.01;

export const IMPACT_SCORE_WEIGHT = 0.2;

export const INSIGHT_DEFAULT_LIMIT = 20;

export const IQR_K = 1.5;

export const LOWESS_N_STEPS = 2;

export const PATTERN_TYPES = [
  'category_outlier',
  'trend',
  'change_point',
  'time_series_outlier',
  'majority',
  'low_variance',
  'correlation',
] as const;

export const HOMOGENEOUS_PATTERN_TYPES = ['commonness', 'exception'] as const;

export const VERIFICATION_FAILURE_INFO = 'The input does not meet the requirements.';

export const NO_PATTERN_INFO = 'No insights were found at the specified significance threshold.';

export const CHANGE_POINT_SIGNIFICANCE_BENCHMARK = 0.15;

export const INSIGHT_COLOR_PALETTE: Record<string, string> = {
  highlight: '#E09322',
  outlier: '#CB5140',
  font: '#2C3542',
  defaultPointColor: '#fff',
} as const;

export const BOLD_FONT_WEIGHT = 500;

export const TEXT_STYLE = {
  textAlign: 'center',
  fill: INSIGHT_COLOR_PALETTE.font,
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

export const PIE_RADIUS_STYLE = {
  innerRadius: 0.25,
  outerRadius: 0.8,
};
