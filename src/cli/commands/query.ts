import { request } from '../session/client';
import { readJSONFile, readText } from '../io';
import { withLocalCSV } from '../dataset';
import { semanticOutputSchema } from '../../contracts';
import { numberOption, option } from '../options';

import type { Options } from '../options';

export const description = "Execute a query in the dataset engine's language";

export const definition = {
  positionals: 1,
  options: {
    dsl: { type: 'string' },
    local: { type: 'boolean' },
    'semantic-file': { type: 'string' },
    'max-rows': { type: 'string' },
    'max-result-bytes': { type: 'string' },
  },
} as const;

export async function run([dataset]: string[], options: Options): Promise<unknown> {
  const raw = option(options, 'dsl');
  const semanticFile = option(options, 'semantic-file');
  if (semanticFile !== undefined && !options.local) throw new Error('--semantic-file requires --local.');
  if (raw === '-' && semanticFile === '-') throw new Error('--dsl and --semantic-file cannot both read stdin.');

  if (raw === undefined) throw new Error('A non-empty --dsl is required.');

  const dsl = await readText(raw);

  if (!dsl.trim()) throw new Error('A non-empty --dsl is required.');
  if (Buffer.byteLength(dsl) > 512 * 1024) throw new Error('--dsl exceeds 512 KiB.');

  const limits = {
    maxRows: numberOption(options, 'max-rows', 10000),
    maxResultBytes: numberOption(options, 'max-result-bytes'),
  };
  if (options.local) {
    const semantic =
      semanticFile === undefined ? undefined : semanticOutputSchema.parse(await readJSONFile(semanticFile));
    return withLocalCSV(dataset, async (ava) => {
      if (semantic !== undefined) await ava.semantic(undefined, () => semantic);
      const result = await ava.query(dsl, limits);
      return semantic === undefined ? result : { ...result, semanticLoaded: true };
    });
  }

  return request(dataset, { command: 'query', dsl, ...limits });
}

export const help = `${description}.

Usage:
  ava query <dataset-id> --dsl <code|@file|-> [options]
  ava query --local <csv-path> --dsl <sql|@file|-> [options]

Use the datasetId returned by ava source. Returns query results as JSON.
Use ava schema to find the query language, table and field names. No API key is required.
SQL engines require a read-only SELECT; Python/JavaScript execute analysis code.
Local Python execution is not sandboxed. Session engine selection is fixed by ava source.
With --local, DuckDB reads one local CSV as the data table without creating a session.

Options:
  --dsl <code|@file|->     Required SQL, Python or JavaScript, @file, or - for stdin (max: 512 KiB).
  --local                Run read-only SQL against a local CSV in the foreground.
  --semantic-file <path|->  With --local, load Semantic JSON from a file or stdin.
                            Adds semanticLoaded: true on success. SQL still runs as written.
  --max-rows <n>          Maximum result rows, 1-10000 (default: 200).
  --max-result-bytes <n>  Positive integer byte limit for result data
                         (default: 1048576, or 1 MiB).
  -h, --help              Show help.

Examples:
  ava query ds_... --dsl 'SELECT 1 AS value'
  ava query ds_... --dsl @query.sql`;
