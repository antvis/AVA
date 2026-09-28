import { request } from '../session/client';

export const description = 'Generate DSL without executing it';

export const definition = {
  positionals: 2,
  options: {},
} as const;

export async function run([datasetId, query]: string[]): Promise<unknown> {
  return request(datasetId, { command: 'translate', query });
}

export const help = `${description}.

Usage:
  ava translate <dataset-id> "<query>"

Use the datasetId returned by ava source.
Returns { "dsl": "..." } as JSON; use ava query to execute the DSL.
Requires OPENAI_API_KEY to have been set before loading that dataset.

Options:
  -h, --help  Show help.

Example:
  ava translate ds_... "What is the average revenue by region?"`;
