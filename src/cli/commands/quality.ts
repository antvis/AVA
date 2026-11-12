import { request } from '../session/client';
import { list } from '../options';
import { qualityInputSchema } from '../../contracts';

import type { Options } from '../options';

export const description = 'Evaluate data quality from the saved profile';

export const definition = {
  positionals: 1,
  options: { rules: { type: 'string' } },
} as const;

export async function run([datasetId]: string[], options: Options): Promise<unknown> {
  const { rules } = qualityInputSchema.parse({ rules: list(options, 'rules') });
  return request(datasetId, { command: 'quality', rules });
}

export const help = `${description}.

Usage:
  ava quality <dataset-id> [options]

Run ava profile first. Quality rules use the observations already saved for the dataset.

Options:
  --rules <list>  Comma-separated rules. Defaults to all rules.
  -h, --help      Show help.

Rules:
  constant, duplicates, empty, high_cardinality, high_correlation, imbalance,
  infinite, missing, skewed, unique, unsupported, zeros

Example:
  ava quality ds_... --rules missing,duplicates`;
