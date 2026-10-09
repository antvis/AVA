import { extname, resolve } from 'path';

import { createSession } from '../session/client';
import { engineTypeSchema, sourceConfig } from '../session/protocol';
import { llmConfig } from '../config';
import { readJSON } from '../io';
import { option } from '../options';
import { accent, badge, muted } from '../util';

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
  options: { type: { type: 'string', short: 't' }, engine: { type: 'string' } },
} as const;

export async function run([dataset]: string[], options: Options): Promise<{ datasetId: string }> {
  const engine = engineTypeSchema.optional().parse(option(options, 'engine'));
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

  return createSession(config, llmConfig(config.type === 'text'), engine);
}

/**
 * Guide terminal users through the next steps with their newly loaded dataset.
 */
export function formatResult({ datasetId }: { datasetId: string }): string {
  return `${accent('✦')} ${badge('AVA')} Ready to explore · ${accent(datasetId)}

${muted('View schema:')} ${accent(`ava schema ${datasetId}`)} ${muted('· More commands:')} ${accent('ava --help')}`;
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
  --engine <type>    duckdb, python, javascript, supabase, or clickhouse.
                    Default: supabase/clickhouse for those sources, otherwise duckdb.
                    Fixed for the session; source support depends on the engine.
  -h, --help         Show help.

Environment:
  OPENAI_API_KEY     Required for text sources and subsequent AI commands.
  OPENAI_MODEL       Model name (default: gpt-4o-mini).
  OPENAI_BASE_URL    Optional API base URL.
  Model settings are fixed when the dataset is loaded.

In a terminal, shows the dataset ID and suggested next commands.
When piped or redirected, returns JSON containing datasetId.
IDs use a sanitized source name plus a random suffix. Requires macOS or Linux.
Sessions expire after 30 idle minutes; dispose releases them immediately.
Python requires python3 and pandas; local Python execution is not sandboxed.
JavaScript accepts inline csv/json/text configs. Use ava schema to inspect the query language.

Examples:
  ava source sales.csv
  ava source sales.csv --engine python
  ava source @source.json
  echo '{ "type": "json", "options": { "data": [{ "sales": 10 }] } }' | ava source -`;
