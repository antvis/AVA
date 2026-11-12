import { renderProfileHtml } from '../../util/profile-report';
import { readJSONFile, writeHTML } from '../io';
import { option } from '../options';

import type { Options } from '../options';

export const description = 'Save a standalone HTML report from a profile';
export const definition = {
  positionals: 1,
  options: { title: { type: 'string' }, output: { type: 'string', short: 'o' } },
} as const;

export async function run([input]: string[], options: Options): Promise<unknown> {
  const html = renderProfileHtml(await readJSONFile(input), { title: option(options, 'title') });
  return writeHTML(option(options, 'output'), html);
}

export const help = `${description}.

Usage:
  ava profile-report <profile.json|-> -o <report.html> [--title <title>]

The report uses saved observations. It runs without a dataset session or a network connection.`;
