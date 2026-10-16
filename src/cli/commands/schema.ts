import { request } from '../session/client';
import { readJSON } from '../io';
import { option } from '../options';
import { schemaMetadataSchema } from '../../util/schema';

import type { Options } from '../options';

export const description = 'Describe the dataset';

export const definition = {
  positionals: 1,
  options: { file: { type: 'string' } },
} as const;

export async function run([datasetId]: string[], options: Options): Promise<unknown> {
  const file = option(options, 'file');
  const schema = file === undefined ? undefined : schemaMetadataSchema.parse(await readJSON(`@${file}`));
  return request(datasetId, { command: 'schema', schema });
}

export const help = `${description}.

Usage:
  ava schema <dataset-id> [--file <path>]

Returns tables, fields, relations and language (name, fence, optional instructions)
as JSON, without computing statistics. Use language to write queries for this session.
Use the datasetId returned by ava source.

Options:
  --file <path>  Set the schema from a JSON file instead of discovering it.
                 Replaces the saved schema and clears the saved profile.
  -h, --help     Show help.

Example:
  ava schema ds_...
  ava schema ds_... --file schema.json`;
