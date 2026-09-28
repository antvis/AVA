import { parseArgs } from 'util';

export type Options = Record<string, string | boolean | undefined>;
export type OptionDefinitions = Record<string, { type: 'string' | 'boolean'; short?: string; multiple?: false }>;

export function parse(argv: string[], definitions: OptionDefinitions = {}): { values: string[]; options: Options } {
  const parsed = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { ...definitions, help: { type: 'boolean', short: 'h' } },
  });

  return { values: parsed.positionals, options: parsed.values };
}

export function option(options: Options, name: string): string | undefined {
  return options[name] as string | undefined;
}

export function list(options: Options, name: string): string[] | undefined {
  const value = option(options, name);

  if (value === undefined) return undefined;
  if (!value.trim()) return [];
  const values = value.split(',').map((item) => item.trim());

  if (values.some((item) => !item)) throw new Error(`--${name} contains an empty item.`);

  return values;
}

export function numberOption(options: Options, name: string, max = Number.MAX_SAFE_INTEGER): number | undefined {
  const raw = option(options, name);

  if (raw === undefined) return undefined;
  const value = Number(raw);

  if (!Number.isSafeInteger(value) || value <= 0 || value > max)
    throw new Error(`--${name} must be an integer between 1 and ${max}.`);

  return value;
}
