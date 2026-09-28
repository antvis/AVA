import { z } from 'zod';

import { chartDefinitions } from '../../visualization/vis';
import { readJSON, writeHTML } from '../io';
import { option } from '../options';

import type { ChartSpec } from '../../types';
import type { Options } from '../options';

export const description = 'Render a chart specification to HTML';

export const definition = {
  positionals: 0,
  options: {
    spec: { type: 'string' },
    output: { type: 'string', short: 'o' },
  },
} as const;

export async function run(_args: string[], options: Options): Promise<unknown> {
  const output = option(options, 'output');

  if (!output) throw new Error('--output is required.');

  const raw = option(options, 'spec');

  if (raw === undefined) throw new Error('--spec is required.');

  const spec = z
    .object({ chartType: z.string(), syntax: z.string().trim().min(1) })
    .strict()
    .parse(await readJSON(raw));

  if (!chartDefinitions.some((chart) => chart.type === spec.chartType)) throw new Error('Unknown chartType.');

  const { AVA } = await import('../../ava');
  const ava = new AVA({ llm: { model: 'unused' } });

  return await writeHTML(output, await ava.viz(spec as ChartSpec));
}

export const help = `${description}.

Usage:
  ava viz --spec <json|@file|-> --output <path>

Spec must contain chartType and syntax (GPT-Vis syntax), as returned by ava recommend.
Returns { "output": "<absolute-path>" } as JSON. No API key is required.

Options:
  --spec <json|@file|->  Required JSON spec, @file, or - for stdin.
  -o, --output <path>    Required HTML file path; existing files are not overwritten.
  -h, --help             Show help.

Example:
  ava viz --spec @chart.json --output chart.html`;
