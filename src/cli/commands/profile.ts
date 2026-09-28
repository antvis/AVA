import { request } from '../session/client';
import { list } from '../options';

import type { Options } from '../options';

export const description = 'Compute dataset statistics';

export const definition = {
  positionals: 1,
  options: { metrics: { type: 'string' } },
} as const;

export async function run([datasetId]: string[], options: Options): Promise<unknown> {
  return request(datasetId, { command: 'profile', metrics: list(options, 'metrics') });
}

export const help = `${description}.

Usage:
  ava profile <dataset-id> [options]

Use the datasetId returned by ava source.
Returns a JSON profile and retains it for subsequent analysis commands.

Options:
  --metrics <list>  Comma-separated metric names; replaces the defaults.
                   Use --metrics "" for structure without statistics.
  -h, --help        Show help.

Default metrics:
  row_count, null_count, distinct_count, top_values, min, max, mean

Additional metrics:
  duplicate_count, min_length, max_length, sum, stddev, median
  Metrics apply only to compatible fields.

Example:
  ava profile ds_... --metrics row_count,null_count,mean`;
