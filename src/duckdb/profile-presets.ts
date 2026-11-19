import { DEFAULT_METRICS } from '../util/profile';

import type { ProfileOptions } from '../types';

const univariate = [
  ...DEFAULT_METRICS.filter((id) => id !== 'top_values'),
  { id: 'top_values', limit: 10, maxDistinctRatio: 1 },
  'table_summary',
  'valid_count',
  'null_ratio',
  'distinct_ratio',
  'unique_count',
  'unique_ratio',
  'is_unique',
  'memory_size',
  'record_size',
  'sum',
  'stddev',
  'variance',
  'median',
  'mad',
  'iqr',
  'cv',
  'range',
  'quantiles',
  'histogram',
  'skewness',
  'kurtosis',
  'monotonicity',
  'zero_count',
  'zero_ratio',
  'negative_count',
  'negative_ratio',
  'infinite_count',
  'infinite_ratio',
  'imbalance',
  'mode',
  'mode_count',
];

export function profilePreset(options: ProfileOptions): ProfileOptions {
  if (!options.preset) return options;
  const base: ProfileOptions = { ...options, semantics: options.semantics ?? 'data-profiling' };
  if (options.preset === 'minimal') return { ...base, metrics: options.metrics ?? [...univariate, 'extreme_values'] };

  const root = options.inferTypes?.fileRoot;
  const inferTypes = { url: true, path: true, image: !!root, ...options.inferTypes };
  const metrics = [
    ...univariate,
    { id: 'extreme_values', limit: 10 },
    'text_examples',
    'min_length',
    'max_length',
    'mean_length',
    'median_length',
    'length_histogram',
    'word_counts',
    'unicode_summary',
    'url_summary',
    'path_summary',
    'date_validation',
    'chi_squared',
    'auto',
    'missing_bands',
    'missing_correlation',
    'scatter_pairs',
    'row_sample',
    'row_duplicates',
    ...(root
      ? [
          { id: 'file_summary', root },
          { id: 'image_summary', root },
        ]
      : []),
  ];
  return { ...base, inferTypes, metrics: options.metrics ?? metrics };
}
