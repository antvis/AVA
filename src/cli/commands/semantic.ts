import { request } from '../session/client';
import { readText } from '../io';
import { option } from '../options';
import { parseSemantic } from '../../contracts/semantic';

import type { Options } from '../options';

export const description = 'Read or replace an Apache Ossie semantic model';

export const definition = {
  positionals: 1,
  options: { file: { type: 'string' }, clear: { type: 'boolean' } },
} as const;

export async function run([datasetId]: string[], options: Options): Promise<unknown> {
  const file = option(options, 'file');
  if (options.clear && file !== undefined) throw new Error('--clear cannot be combined with --file.');
  const semantic =
    file === undefined
      ? options.clear
        ? null
        : undefined
      : parseSemantic(await readText(file === '-' ? '-' : `@${file}`));
  return request(datasetId, { command: 'semantic', semantic });
}

export const help = `${description}.

Usage:
  ava semantic <dataset-id> [--file <path|-> | --clear]

Returns the session's Apache Ossie 0.3.0.dev0 model as JSON, or null if unset.
Use the datasetId returned by ava source. No API key is required.
Definitions guide analyze, translate and suggest; query executes DSL as written.

Options:
  --file <path|->  Replace the model with an Ossie YAML or JSON document (or - for stdin).
  --clear          Remove the session's semantic model.
  -h, --help     Show help.

Keep the model file to reuse definitions after the session expires or is disposed.

Example:
  ava semantic ds_...
  ava semantic ds_... --file semantic.yaml`;
