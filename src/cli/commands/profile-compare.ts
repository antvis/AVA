import { compareProfiles } from '../../util/profile-compare';
import { renderProfileComparisonHtml } from '../../util/profile-report';
import { readJSONFile, writeHTML } from '../io';
import { option } from '../options';

import type { Options } from '../options';

export const description = 'Compare two saved profiles';
export const definition = { positionals: 2, options: { output: { type: 'string', short: 'o' } } } as const;

export async function run([before, after]: string[], options: Options): Promise<unknown> {
  if (before === '-' && after === '-') throw new Error('Only one saved profile can be read from stdin');
  const [left, right] = await Promise.all([readJSONFile(before), readJSONFile(after)]);
  const output = option(options, 'output');
  return output === undefined
    ? compareProfiles(left, right)
    : writeHTML(output, renderProfileComparisonHtml(left, right));
}

export const help = `${description}.

Usage:
  ava profile-compare <before.json> <after.json> [-o comparison.html]

Aligns models, columns and metrics by name and reports numeric deltas.
With -o, saves a standalone HTML comparison.
Use - for at most one input to read the profile from stdin.`;
