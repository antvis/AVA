import { z } from 'zod';

import { AVA } from '../../ava';
import { llmConfig } from '../config';
import { readJSON, writeHTML } from '../io';
import { option } from '../options';

import type { Options } from '../options';

export const description = 'Generate a chart from query and data';

export const definition = {
  positionals: 0,
  options: {
    query: { type: 'string' },
    data: { type: 'string' },
    output: { type: 'string', short: 'o' },
  },
} as const;

export async function run(_args: string[], options: Options): Promise<unknown> {
  const query = option(options, 'query');
  const raw = option(options, 'data');

  if (!query?.trim() || raw === undefined) throw new Error('--query and --data are required.');

  const data = z.array(z.record(z.unknown())).parse(await readJSON(raw));

  const ava = new AVA({ llm: llmConfig(true) });
  const result = await ava.visualize({ query, data });

  if (!result) return null;

  const output = option(options, 'output');

  return { ...result, ...(output ? await writeHTML(output, result.html) : {}) };
}

export const help = `${description}.

Usage:
  ava visualize --query "<text>" --data <json|@file|-> [options]

Returns { chartType, syntax, html } as JSON, or null if no chart is recommended.
With --output, also writes HTML and includes its absolute path in output.

Options:
  --query <text>         Required natural-language visualization request.
  --data <json|@file|->  Required JSON array of objects, @file, or - for stdin.
  -o, --output <path>    Save HTML to a new file; existing files are not overwritten.
  -h, --help             Show help.

Environment:
  OPENAI_API_KEY        Required; read from the current environment.
  OPENAI_MODEL          Model name (default: gpt-4o-mini).
  OPENAI_BASE_URL       Optional API base URL.

Example:
  ava visualize --query "Show revenue by region" --data @rows.json -o chart.html`;
