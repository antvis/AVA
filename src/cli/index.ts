#!/usr/bin/env node

import { AVA } from '../index';

import { ANALYZE_HELP, ROOT_HELP } from './help';
import { flag, llmConfig, option, parse } from './options';
import { formatError, inferSource, writeOutput } from './util';

import type { Env } from './options';

type Write = (value: string) => void;

export async function run(
  argv: string[],
  env: Env = process.env,
  write: Write = (value) => process.stdout.write(`${value}\n`)
): Promise<void> {
  const { values, options } = parse(argv);
  const [command, source, ...question] = values;
  if (!command) {
    write(ROOT_HELP);
    return;
  }
  if (command !== 'analyze') throw new Error(`Unknown command "${command}".\n\n${ROOT_HELP}`);
  if (flag(options, 'help')) {
    write(ANALYZE_HELP);
    return;
  }
  if (!source) throw new Error(`Missing required argument: <source>.\n\n${ANALYZE_HELP}`);

  const query = question.join(' ').trim();
  if (!query) throw new Error('A non-empty question is required.');

  const chart = flag(options, 'chart');
  const output = option(options, 'output');
  if (output && !chart) throw new Error('--output requires --chart.');

  const ava = new AVA({ llm: llmConfig(env) });
  try {
    await ava.load(inferSource(source, option(options, 'type')));
    const analysis = await ava.analysis(query);
    const visualization = chart ? await ava.visualize(analysis) : undefined;
    if (output && visualization) await writeOutput(output, visualization.html);
    write(JSON.stringify({ analysis, ...(chart ? { visualization } : {}) }, null, 2));
  } finally {
    await ava.dispose();
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  run(process.argv.slice(2)).catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(formatError(error));
    process.exitCode = 1;
  });
}
