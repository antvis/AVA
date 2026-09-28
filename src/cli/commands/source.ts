import { extname, resolve } from 'path';

import { createSession } from '../session/client';
import { sourceConfig } from '../session/protocol';
import { llmConfig } from '../config';
import { readJSON } from '../io';
import { option } from '../options';

import type { Options } from '../options';

const sourceTypes: Record<string, string> = {
  '.csv': 'csv-file',
  '.json': 'json-file',
  '.parquet': 'parquet',
  '.xlsx': 'excel',
  '.sqlite': 'sqlite',
  '.sqlite3': 'sqlite',
  '.db': 'sqlite',
};

export const description = 'Load a source and return a dataset ID';

export const definition = {
  positionals: 1,
  options: { type: { type: 'string', short: 't' } },
} as const;

export async function run([dataset]: string[], options: Options): Promise<unknown> {
  let input: unknown;

  if (dataset.startsWith('@') || dataset === '-') {
    if (options.type !== undefined) throw new Error('--type cannot be combined with a source config.');
    input = await readJSON(dataset);
  } else {
    const pathname = /^https?:\/\//i.test(dataset) ? new URL(dataset).pathname : dataset;
    const type = option(options, 'type') ?? sourceTypes[extname(pathname).toLowerCase()];
    if (!type) throw new Error('Cannot infer the source type. Pass --type.');
    input = { type, options: { path: dataset } };
  }

  const config = sourceConfig.parse(input);

  if ('path' in config.options && !/^https?:\/\//i.test(config.options.path)) {
    config.options.path = resolve(config.options.path);
  }

  return createSession(config, llmConfig(config.type === 'text'));
}

export const help = `${description}.

Usage:
  ava source <dataset> [options]

Arguments:
  dataset           File/URL, @file containing a source config, or - for stdin.
                    Config format: { "type": "json", "options": { "data": [] } }
                    Relative paths resolve from the current working directory.

Options:
  -t, --type <type>  Override the type inferred from the file extension.
                    Types: csv-file, json-file, parquet, excel, sqlite.
                    Cannot be used with @file or stdin configs.
  -h, --help         Show help.

Environment:
  OPENAI_API_KEY     Required for text sources and subsequent AI commands.
  OPENAI_MODEL       Model name (default: gpt-4o-mini).
  OPENAI_BASE_URL    Optional API base URL.
  Model settings are fixed when the dataset is loaded.

Returns JSON containing datasetId, e.g. ds_sales_a7c92e4f18b3.
IDs use a sanitized source name plus a random suffix. Requires macOS or Linux.
Sessions expire after 30 idle minutes; dispose releases them immediately.

Examples:
  ava source sales.csv
  ava source @source.json
  echo '{ "type": "json", "options": { "data": [{ "sales": 10 }] } }' | ava source -`;
