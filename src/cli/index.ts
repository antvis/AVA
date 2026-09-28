#!/usr/bin/env node

import * as source from './commands/source';
import * as schema from './commands/schema';
import * as profile from './commands/profile';
import * as suggest from './commands/suggest';
import * as analyze from './commands/analyze';
import * as translate from './commands/translate';
import * as query from './commands/query';
import * as visualize from './commands/visualize';
import * as recommend from './commands/recommend';
import * as viz from './commands/viz';
import * as dispose from './commands/dispose';
import { parse } from './options';
import { accent, badge, muted, formatError } from './util';

const commands = {
  source,
  schema,
  profile,
  suggest,
  analyze,
  translate,
  query,
  visualize,
  recommend,
  viz,
  dispose,
};

const ROOT_HELP = `${accent('✦')} ${badge('AVA')} ${muted('AI-native Visual Analytics')}

${accent('Usage:')}
  ava <command> [options]

${accent('Commands:')}
${Object.entries(commands)
  .map(([name, command]) => `  ${name.padEnd(12)} ${command.description}`)
  .join('\n')}

${accent('Options:')}
  -h, --help                   Show help

Run "ava <command> --help" for command-specific usage.
Commands return JSON on stdout; errors go to stderr with exit code 1.
Sessions expire after 30 idle minutes and require macOS or Linux.`;

type Write = (value: string) => void;

export async function run(argv: string[], write: Write = (value) => process.stdout.write(`${value}\n`)): Promise<void> {
  const [command, ...input] = argv;

  if (!command || command.startsWith('-')) {
    const { values } = parse(argv);
    if (values.length) throw new Error('Usage: ava <command> [options]');
    write(ROOT_HELP);
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(commands, command)) {
    throw new Error(`Unknown command "${command}".\n\n${ROOT_HELP}`);
  }

  const handler = commands[command as keyof typeof commands];
  const { values: args, options } = parse(input, handler.definition.options);

  if (options.help) {
    write(handler.help);
    return;
  }

  if (args.length !== handler.definition.positionals || args.some((arg) => !arg.trim())) {
    throw new Error(`Invalid arguments for "${command}".\n\n${handler.help}`);
  }
  write(JSON.stringify(await handler.run(args, options), null, 2));
}

if (typeof require !== 'undefined' && require.main === module) {
  run(process.argv.slice(2)).catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(formatError(error));
    process.exitCode = 1;
  });
}
