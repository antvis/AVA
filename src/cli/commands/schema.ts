import { request } from '../session/client';
import { describeSchema, withLocalCSV } from '../dataset';
import { readJSONFile } from '../io';
import { option } from '../options';
import { schemaOutputSchema } from '../../contracts';

import type { Options } from '../options';

export const description = 'Describe the dataset';

export const definition = {
  positionals: 1,
  options: { file: { type: 'string' }, local: { type: 'boolean' } },
} as const;

export async function run([dataset]: string[], options: Options): Promise<unknown> {
  const file = option(options, 'file');
  if (options.local) {
    if (file !== undefined) throw new Error('--file cannot be combined with --local.');
    return withLocalCSV(dataset, describeSchema);
  }

  const schema = file === undefined ? undefined : schemaOutputSchema.parse(await readJSONFile(file));
  return request(dataset, { command: 'schema', schema });
}

export const help = `${description}.

Usage:
  ava schema <dataset-id> [--file <path|->]
  ava schema --local <csv-path>

Returns the dataset structure, execution language id and optional query instructions as JSON.
Use this information to write queries for the session.
Use the datasetId returned by ava source, or inspect a local CSV in the foreground.

Options:
  --file <path|->  Set the schema from a JSON file (or - for stdin) instead of discovering it.
                 Replaces the saved schema and clears the saved profile.
  --local        Inspect one local CSV without creating a session.
  -h, --help     Show help.

Example:
  ava schema ds_...
  ava schema ds_... --file schema.json`;
