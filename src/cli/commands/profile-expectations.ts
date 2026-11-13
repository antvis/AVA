import { profileExpectations } from '../../util/profile-expectations';
import { readJSONFile } from '../io';
import { option } from '../options';

import type { Options } from '../options';

export const description = 'Generate expectation suites from a saved profile';
export const definition = { positionals: 1, options: { name: { type: 'string' } } } as const;

export async function run([input]: string[], options: Options): Promise<unknown> {
  return profileExpectations(await readJSONFile(input), { name: option(options, 'name') });
}

export const help = `${description}.

Usage:
  ava profile-expectations <profile.json|-> [--name <suite-name>]

Returns one suite per model using saved observations.`;
