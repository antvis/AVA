import { AVA } from '../../ava';
import { vizInputSchema } from '../../contracts';
import { readJSON, writeHTML } from '../io';
import { option } from '../options';

import type { Options } from '../options';

export const description = 'Validate a chart specification or render it to HTML';

export const definition = {
  positionals: 0,
  options: {
    spec: { type: 'string' },
    output: { type: 'string', short: 'o' },
  },
} as const;

export async function run(_args: string[], options: Options): Promise<unknown> {
  const output = option(options, 'output');

  const raw = option(options, 'spec');

  if (raw === undefined) throw new Error('--spec is required.');

  const spec = vizInputSchema.parse(await readJSON(raw));

  if (output === undefined) return { chartType: spec.chartType, config: spec.config };

  const ava = new AVA({ llm: { model: 'unused' } });

  return writeHTML(output, await ava.viz(spec));
}

export const help = `${description}.

Usage:
  ava viz --spec <json|@file|-> [--output <path>]

Spec must contain chartType and config (GPT-Vis JSON config), as returned by ava recommend.
Without --output, returns the validated { chartType, config } as JSON.
With --output, writes HTML and returns { "output": "<absolute-path>" }.
No API key is required.

Options:
  --spec <json|@file|->  Required JSON spec, @file, or - for stdin.
  -o, --output <path>    Save HTML to a new file; existing files are not overwritten.
  -h, --help             Show help.

Example:
  ava viz --spec @chart.json --output chart.html`;
