import { request } from '../session/client';
import { numberOption } from '../options';

import type { Options } from '../options';

export const description = 'Suggest analysis questions';

export const definition = {
  positionals: 1,
  options: { count: { type: 'string' } },
} as const;

export async function run([datasetId]: string[], options: Options): Promise<unknown> {
  const count = numberOption(options, 'count', 100) ?? 3;

  return request(datasetId, { command: 'suggest', count });
}

export const help = `${description}.

Usage:
  ava suggest <dataset-id> [options]

Use the datasetId returned by ava source.
Requires OPENAI_API_KEY to have been set before loading that dataset.

Options:
  --count <n>  Number of questions, 1-100 (default: 3).
  -h, --help   Show help.

Example:
  ava suggest ds_... --count 5`;
