import { validateProfileExpectations } from '../../util/profile-expectations';
import { readJSONFile } from '../io';

export const description = 'Validate expectation suites against a saved profile';
export const definition = { positionals: 2, options: {} } as const;

export async function run([input, suites]: string[]): Promise<unknown> {
  if (input === '-' && suites === '-') throw new Error('Only one input can be read from stdin');
  const [profile, expectations] = await Promise.all([readJSONFile(input), readJSONFile(suites)]);
  return validateProfileExpectations(profile, expectations);
}

export const help = `${description}.

Usage:
  ava profile-validate <profile.json> <suites.json>

Use - for one input. Validation returns pass, fail, or missing evidence for each expectation.`;
