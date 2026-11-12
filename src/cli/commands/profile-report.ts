import { profileReportOptions, renderProfileHtml } from '../../util/profile-report';
import { readJSONFile, writeHTML } from '../io';
import { option } from '../options';

import type { Options } from '../options';

export const description = 'Save a standalone HTML report from a profile';
export const definition = {
  positionals: 1,
  options: {
    title: { type: 'string' },
    output: { type: 'string', short: 'o' },
    theme: { type: 'string' },
    transparent: { type: 'boolean' },
    'full-width': { type: 'boolean' },
  },
} as const;

export async function run([input]: string[], options: Options): Promise<unknown> {
  const settings = profileReportOptions.parse({
    title: option(options, 'title'),
    theme: option(options, 'theme'),
    transparent: options.transparent,
    fullWidth: options['full-width'],
  });
  const html = renderProfileHtml(await readJSONFile(input), settings);
  return writeHTML(option(options, 'output'), html);
}

export const help = `${description}.

Usage:
  ava profile-report <profile.json|-> -o <report.html> [--title <title>]
                     [--theme <light|dark|auto>] [--transparent] [--full-width]

The report uses saved observations. It runs without a dataset session or a network connection.`;
