// Should be confidence level. Is the SIGNIFICANCE_BENCHMARK naming correct? by @pddpd
export const SIGNIFICANCE_BENCHMARK = 0.95;

export const SIGNIFICANCE_LEVEL = 0.05;

export const InsightScoreBenchmark = 0.01;

export const ImpactScoreWeight = 0.2;

export const InsightDefaultLimit = 20;

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

export const VERIFICATION_FAILURE_INFO = 'The data does not meet the requirements.';

export const NO_PATTERN_INFO = 'No insights were found at the specified significance threshold.';
