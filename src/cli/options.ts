import { parseArgs } from 'util';

import type { LLMConfig } from '../types';

export type Options = Record<string, string | boolean | undefined>;
export type Env = Record<string, string | undefined>;

export function parse(argv: string[]): { values: string[]; options: Options } {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      chart: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      output: { type: 'string' },
      type: { type: 'string' },
    },
  });
  return { values: positionals, options: values };
}

export function option(options: Options, name: string): string | undefined {
  const value = options[name];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error(`--${name} requires a value.`);
  return value;
}

export function flag(options: Options, name: string): boolean {
  const value = options[name];
  if (value === undefined) return false;
  if (typeof value !== 'boolean') throw new Error(`--${name} does not take a value.`);
  return value;
}

export function llmConfig(env: Env): LLMConfig {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Set OPENAI_API_KEY.');

  const baseURL = env.OPENAI_BASE_URL;
  return {
    apiKey,
    model: env.OPENAI_MODEL ?? 'gpt-4o-mini',
    ...(baseURL ? { baseURL } : {}),
  };
}
