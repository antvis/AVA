import { request } from '../session/client';
import { readText } from '../io';
import { numberOption, option } from '../options';

import type { Options } from '../options';

export const description = 'Execute a read-only query';

export const definition = {
  positionals: 1,
  options: {
    dsl: { type: 'string' },
    'max-rows': { type: 'string' },
    'max-result-bytes': { type: 'string' },
  },
} as const;

export async function run([datasetId]: string[], options: Options): Promise<unknown> {
  const raw = option(options, 'dsl');

  if (raw === undefined) throw new Error('A non-empty --dsl is required.');

  const dsl = await readText(raw);

  if (!dsl.trim()) throw new Error('A non-empty --dsl is required.');
  if (Buffer.byteLength(dsl) > 512 * 1024) throw new Error('--dsl exceeds 512 KiB.');

  return request(datasetId, {
    command: 'query',
    dsl,
    maxRows: numberOption(options, 'max-rows', 10000),
    maxResultBytes: numberOption(options, 'max-result-bytes'),
  });
}

export const help = `${description}.

Usage:
  ava query <dataset-id> --dsl <sql|@file|-> [options]

Use the datasetId returned by ava source. Returns query results as JSON.
Use ava schema to find table and field names. No API key is required.

Options:
  --dsl <sql|@file|->      Required SQL text, @file, or - for stdin (max: 512 KiB).
  --max-rows <n>          Maximum result rows, 1-10000 (default: 200).
  --max-result-bytes <n>  Positive integer byte limit for result data
                         (default: 1048576, or 1 MiB).
  -h, --help              Show help.

Examples:
  ava query ds_... --dsl 'SELECT 1 AS value'
  ava query ds_... --dsl @query.sql`;
