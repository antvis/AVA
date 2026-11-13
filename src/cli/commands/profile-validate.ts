import { validateProfileExpectations } from '../../util/profile-expectations';
import { renderProfileValidationHtml } from '../../util/profile-report';
import { readJSONFile, writeHTML } from '../io';
import { option } from '../options';

import type { Options } from '../options';

export const description = 'Validate expectation suites against a saved profile';
export const definition = { positionals: 2, options: { output: { type: 'string', short: 'o' } } } as const;

export async function run([input, suites]: string[], options: Options): Promise<unknown> {
  if (input === '-' && suites === '-') throw new Error('Only one input can be read from stdin');
  const [profile, expectations] = await Promise.all([readJSONFile(input), readJSONFile(suites)]);
  const output = option(options, 'output');
  return output === undefined
    ? validateProfileExpectations(profile, expectations)
    : writeHTML(output, renderProfileValidationHtml(profile, expectations));
}

export const help = `${description}.

Usage:
  ava profile-validate <profile.json> <suites.json> [-o validation.html]

Use - for one input. Validation returns pass, fail, or missing evidence for each expectation.`;
