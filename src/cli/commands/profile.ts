import { request } from '../session/client';
import { list, option } from '../options';
import { readJSONFile } from '../io';
import { profileInputSchema, profileOutputSchema } from '../../contracts';

import type { Options } from '../options';

export const description = 'Compute dataset statistics';

export const definition = {
  positionals: 1,
  options: { metrics: { type: 'string' }, file: { type: 'string' }, options: { type: 'string' } },
} as const;

export async function run([datasetId]: string[], options: Options): Promise<unknown> {
  const file = option(options, 'file');
  const optionsFile = option(options, 'options');
  if (file !== undefined && options.metrics !== undefined) throw new Error('--file cannot be combined with --metrics.');
  if (optionsFile !== undefined && (file !== undefined || options.metrics !== undefined)) {
    throw new Error('--options cannot be combined with --file or --metrics.');
  }
  const profile = file === undefined ? undefined : profileOutputSchema.parse(await readJSONFile(file));
  const profileOptions =
    optionsFile === undefined
      ? { metrics: list(options, 'metrics') }
      : profileInputSchema.parse(await readJSONFile(optionsFile));
  return request(datasetId, { command: 'profile', ...profileOptions, profile });
}

export const help = `${description}.

Usage:
  ava profile <dataset-id> [options]

Use the datasetId returned by ava source.
Returns a JSON profile and retains it for subsequent analysis commands.

Options:
  --file <path|->    Set the profile from a JSON file (or - for stdin) instead of computing it.
                   Cannot be combined with --metrics. Does not replace schema.
  --metrics <list>  Comma-separated metric names; replaces the defaults.
                   Use --metrics "" for structure without statistics.
  --options <path|-> Read ProfileOptions JSON, including metric options, from a file or stdin.
                    Cannot be combined with --file or --metrics.
  -h, --help        Show help.

Default metrics:
  row_count, null_count, distinct_count, top_values, min, max, mean

Additional metrics:
  duplicate_count, min_length, max_length, sum, stddev, median
  DuckDB: valid_count, null_ratio, distinct_ratio, unique_count, unique_ratio, is_unique
  DuckDB numeric: zero_count/ratio, negative_count/ratio, infinite_count/ratio,
                  nan_count/ratio, finite_count/ratio (e.g. zero_count, zero_ratio)
  DuckDB quantiles: quantiles (5%, 25%, 50%, 75%, 95%; finite numeric values)
  DuckDB dispersion: variance, mad, iqr, cv, range
  DuckDB distribution shape: skewness, kurtosis, monotonicity, chi_squared
  DuckDB time series: autocorrelation
  DuckDB numeric and date histogram: histogram
  DuckDB frequencies: value_counts, mode, mode_count, imbalance
  DuckDB text: mean_length, median_length, length_histogram, word_counts, character_counts, unicode_summary
  DuckDB structured text: url_summary, path_summary
  DuckDB table metrics: table_summary, row_duplicates, row_sample, pearson, spearman, kendall, cramers, auto
  DuckDB missingness: missing_correlation
  unique_count counts non-null values occurring exactly once; distinct_count counts different values.
  Metrics apply only to compatible fields.

Example:
  ava profile ds_... --metrics row_count,null_count,mean
  ava profile ds_... --file profile.json`;
