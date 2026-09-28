#!/usr/bin/env node

import { ROOT_HELP } from './help';
import { parse } from './options';
import { formatError } from './util';

type Write = (value: string) => void;

export async function run(
  argv: string[],
  write: Write = (value) => process.stdout.write(`${value}\n`)
): Promise<void> {
  const { values } = parse(argv);
  const [command] = values;
  if (command) throw new Error(`Unknown command "${command}".\n\n${ROOT_HELP}`);
  write(ROOT_HELP);
}

if (typeof require !== 'undefined' && require.main === module) {
  run(process.argv.slice(2)).catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(formatError(error));
    process.exitCode = 1;
  });
}
