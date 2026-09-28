import { z } from 'zod';

import { AVA } from '../../ava';
import { llmConfig } from '../config';
import { readJSON } from '../io';
import { option } from '../options';

import type { Options } from '../options';

export const description = 'Recommend a chart specification';

export const definition = {
  positionals: 0,
  options: {
    query: { type: 'string' },
    data: { type: 'string' },
  },
} as const;

export async function run(_args: string[], options: Options): Promise<unknown> {
  const query = option(options, 'query');
  const raw = option(options, 'data');

  if (!query?.trim() || raw === undefined) throw new Error('--query and --data are required.');

  const data = z.array(z.record(z.unknown())).parse(await readJSON(raw));

  const ava = new AVA({ llm: llmConfig(true) });

  return await ava.recommend({ query, data });
}

export const help = `${description}.

Usage:
  ava recommend --query "<text>" --data <json|@file|->

Returns { "chartType": "...", "syntax": "..." }, or null if no chart is recommended.
A non-null result can be passed to ava viz --spec.

Options:
  --query <text>         Required natural-language visualization request.
  --data <json|@file|->  Required JSON array of objects, @file, or - for stdin.
  -h, --help             Show help.

Environment:
  OPENAI_API_KEY        Required; read from the current environment.
  OPENAI_MODEL          Model name (default: gpt-4o-mini).
  OPENAI_BASE_URL       Optional API base URL.

Example:
  ava recommend --query "Show revenue by region" --data @rows.json`;
