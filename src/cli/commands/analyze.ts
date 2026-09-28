import { request } from '../session/client';
import { requestSchema } from '../session/protocol';
import { numberOption, option } from '../options';

import type { Options } from '../options';

export const description = 'Analyze with natural language';

export const definition = {
  positionals: 2,
  options: {
    strategy: { type: 'string' },
    'max-rows': { type: 'string' },
    'max-result-bytes': { type: 'string' },
  },
} as const;

export async function run([datasetId, query]: string[], options: Options): Promise<unknown> {
  return request(
    datasetId,
    requestSchema.parse({
      command: 'analyze',
      query,
      maxRows: numberOption(options, 'max-rows', 10000),
      maxResultBytes: numberOption(options, 'max-result-bytes'),
      strategy: option(options, 'strategy'),
    })
  );
}

export const help = `${description}.

Usage:
  ava analyze <dataset-id> "<query>" [options]

Use the datasetId returned by ava source. Returns analysis as JSON.
Requires OPENAI_API_KEY to have been set before loading that dataset.

Options:
  --strategy <type>       direct, loop, or subset (default: direct).
  --max-rows <n>          Maximum result rows, 1-10000 (default: 200).
  --max-result-bytes <n>  Positive integer byte limit for result data
                         (default: 1048576, or 1 MiB).
  -h, --help              Show help.

Example:
  ava analyze ds_... "What is the average revenue by region?" --max-rows 100`;
