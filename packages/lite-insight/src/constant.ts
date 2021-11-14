export const SignificanceBenchmark = 0.95;

export const InsightScoreBenchmark = 0.01;

export const ImpactScoreWeight = 0.2;

export const InsightDefaultLimit = 20;

export const PATTERN_TYPES = [
  'category_outlier',
  'trend',
  'change_point',
  'time_series_outlier',
  'majority',
  'low_variance',
] as const;

export const HOMOGENEOUS_PATTERN_TYPES = ['commonness', 'exception'] as const;
