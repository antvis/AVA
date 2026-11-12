import { compareProfiles } from '../../util/profile-compare';
import { readJSONFile } from '../io';

export const description = 'Compare two saved profiles';
export const definition = { positionals: 2, options: {} } as const;

export async function run([before, after]: string[]): Promise<unknown> {
  if (before === '-' && after === '-') throw new Error('Only one saved profile can be read from stdin');
  const [left, right] = await Promise.all([readJSONFile(before), readJSONFile(after)]);
  return compareProfiles(left, right);
}

export const help = `${description}.

Usage:
  ava profile-compare <before.json> <after.json>

Aligns models, columns and metrics by name and reports numeric deltas.
Use - for at most one input to read the profile from stdin.`;
