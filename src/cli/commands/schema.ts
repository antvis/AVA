import { request } from '../session/client';

export const description = 'Describe the dataset';

export const definition = {
  positionals: 1,
  options: {},
} as const;

export async function run([datasetId]: string[]): Promise<unknown> {
  return request(datasetId, { command: 'schema' });
}

export const help = `${description}.

Usage:
  ava schema <dataset-id>

Returns tables, fields, relations and language (name, fence, optional instructions)
as JSON, without computing statistics. Use language to write queries for this session.
Use the datasetId returned by ava source.

Options:
  -h, --help  Show help.

Example:
  ava schema ds_...`;
