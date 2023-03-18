export const SignificanceBenchmark = 0.88;

export const InsightScoreBenchmark = 0.01;

export const ImpactScoreWeight = 0.2;

export const InsightDefaultLimit = 20;

export const IQR_K = 0.8;

export const LOWESS_N_STEPS = 2;

export const RESIDUALS_OUTLIERS_LIMIT = 0.05;

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
