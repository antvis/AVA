import { request } from '../session/client';
import { list, option } from '../options';
import { readJSON } from '../io';
import { profileMetadataSchema } from '../../util/profile';

import type { Options } from '../options';

export const description = 'Compute dataset statistics';

export const definition = {
  positionals: 1,
  options: { metrics: { type: 'string' }, file: { type: 'string' } },
} as const;

export async function run([datasetId]: string[], options: Options): Promise<unknown> {
  const file = option(options, 'file');
  if (file !== undefined && options.metrics !== undefined) throw new Error('--file cannot be combined with --metrics.');
  const profile = file === undefined ? undefined : profileMetadataSchema.parse(await readJSON(`@${file}`));
  return request(datasetId, { command: 'profile', metrics: list(options, 'metrics'), profile });
}

export const help = `${description}.

Usage:
  ava profile <dataset-id> [options]

Use the datasetId returned by ava source.
Returns a JSON profile and retains it for subsequent analysis commands.

Options:
  --file <path>    Set the profile from a JSON file instead of computing it.
                   Cannot be combined with --metrics. Does not replace schema.
  --metrics <list>  Comma-separated metric names; replaces the defaults.
                   Use --metrics "" for structure without statistics.
  -h, --help        Show help.

Default metrics:
  row_count, null_count, distinct_count, top_values, min, max, mean

Additional metrics:
  duplicate_count, min_length, max_length, sum, stddev, median
  Metrics apply only to compatible fields.

Example:
  ava profile ds_... --metrics row_count,null_count,mean
  ava profile ds_... --file profile.json`;
