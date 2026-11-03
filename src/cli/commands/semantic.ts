import { request } from '../session/client';
import { readJSON } from '../io';
import { option } from '../options';
import { semanticMetadataSchema } from '../../util/data-model';

import type { Options } from '../options';

export const description = 'Read or replace business definitions';

export const definition = {
  positionals: 1,
  options: { file: { type: 'string' } },
} as const;

export async function run([datasetId]: string[], options: Options): Promise<unknown> {
  const file = option(options, 'file');
  const semantic = file === undefined ? undefined : semanticMetadataSchema.parse(await readJSON(`@${file}`));
  return request(datasetId, { command: 'semantic', semantic });
}

export const help = `${description}.

Usage:
  ava semantic <dataset-id> [--file <path>]

Returns the session's semantic definitions as JSON (initially {}).
Use the datasetId returned by ava source. No API key is required.
Definitions guide analyze, translate and suggest; query executes DSL as written.

Options:
  --file <path>  Replace the complete definition with a Semantic JSON file.
                 Does not replace schema or profile. Use a file containing {} to clear.
  -h, --help     Show help.

Keep the JSON file to reuse definitions after the session expires or is disposed.

Example:
  ava semantic ds_...
  ava semantic ds_... --file semantic.json`;
