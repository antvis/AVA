import { parseArgs } from 'util';

export function parse(argv: string[]): { values: string[] } {
  const { positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
    },
  });
  return { values: positionals };
}
