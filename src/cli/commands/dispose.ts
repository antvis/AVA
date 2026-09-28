import { request } from '../session/client';

export const description = 'Release the dataset and its process';

export const definition = {
  positionals: 1,
  options: {},
} as const;

export async function run([datasetId]: string[]): Promise<unknown> {
  return request(datasetId, { command: 'dispose' });
}

export const help = `${description}.

Usage:
  ava dispose <dataset-id>

Use the datasetId returned by ava source.
The ID becomes invalid after disposal. Load the source again to get a new ID.

Options:
  -h, --help  Show help.

Example:
  ava dispose ds_...`;
