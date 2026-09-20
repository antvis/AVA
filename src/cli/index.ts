#!/usr/bin/env node

import { writeFile } from 'fs/promises';

import { AVA } from '../index';

import { flag, llmConfig, option, parse } from './options';
import { sourceConfig } from './source';

import type { Env } from './options';

type Write = (value: string) => void;

const HELP = `Usage: ava analyze <source> <question> [options]

Answer a question about a data source with AI.

Options:
  --chart                       Generate a visualization for a question
  --output <file>               Write chart HTML (requires --chart)
  --type <csv-file|json-file|parquet|excel>

Environment: OPENAI_API_KEY, OPENAI_MODEL, OPENAI_BASE_URL`;

export async function run(
  argv: string[],
  env: Env = process.env,
  write: Write = (value) => process.stdout.write(`${value}\n`),
): Promise<void> {
  const { values, options } = parse(argv);
  const [command, source, ...question] = values;
  if (!command || flag(options, 'help')) {
    write(HELP);
    return;
  }
  if (command !== 'analyze' || !source) throw new Error(HELP);

  const query = question.join(' ').trim();
  if (!query) throw new Error('A non-empty question is required.');

  const chart = flag(options, 'chart');
  const output = option(options, 'output');
  if (output && !chart) throw new Error('--output requires --chart.');

  const ava = new AVA({ llm: llmConfig(env) });
  try {
    await ava.load(sourceConfig(source, option(options, 'type')));
    const analysis = await ava.analysis(query);
    const visualization = chart ? await ava.visualize(analysis) : undefined;
    if (output && visualization) await writeFile(output, visualization.html);
    write(JSON.stringify({ analysis, ...(chart ? { visualization } : {}) }, null, 2));
  } finally {
    await ava.dispose();
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  run(process.argv.slice(2)).catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
