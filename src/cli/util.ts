import { writeFile } from 'fs/promises';
import * as path from 'path';

import type { DataSourceConfig } from '../types';

const SOURCE_TYPE_BY_EXTENSION: Record<string, string> = {
  '.csv': 'csv-file',
  '.json': 'json-file',
  '.parquet': 'parquet',
  '.xlsx': 'excel',
};

/**
 * Infers a supported file source from its path or explicit type.
 */
export function inferSource(source: string, type?: string): DataSourceConfig {
  const extension = path.extname(source).toLowerCase();
  const sourceType = type ?? SOURCE_TYPE_BY_EXTENSION[extension];

  // Validate source types at the CLI boundary.
  switch (sourceType) {
    case 'csv-file':
    case 'json-file':
    case 'parquet':
    case 'excel':
      return { type: sourceType, options: { path: source } };
    default:
      throw new Error(`Cannot infer the source type for "${source}". Pass --type.`);
  }
}

/**
 * Creates an output file without replacing an existing one.
 */
export async function writeOutput(output: string, content: string): Promise<void> {
  await writeFile(output, content, { flag: 'wx' });
}

function colorsEnabled(isTTY: boolean | undefined): boolean {
  return Boolean(isTTY && !('NO_COLOR' in process.env));
}

function ansi(code: string, value: string): string {
  return `\u001B[${code}m${value}\u001B[0m`;
}

export const bold = (value: string, color = colorsEnabled(process.stdout.isTTY)) => (color ? ansi('1', value) : value);
export const accent = (value: string, color = colorsEnabled(process.stdout.isTTY)) =>
  color ? ansi('1;36', value) : value;
export const muted = (value: string, color = colorsEnabled(process.stdout.isTTY)) => (color ? ansi('2', value) : value);
export const badge = (value: string, color = colorsEnabled(process.stdout.isTTY)) => {
  const label = ` ${value} `;
  return color ? ansi('1;30;46', label) : label;
};
const danger = (value: string, color = colorsEnabled(process.stderr.isTTY)) => (color ? ansi('1;31', value) : value);

/**
 * Formats CLI errors for terminals without affecting machine-readable output.
 */
export function formatError(error: unknown, color = colorsEnabled(process.stderr.isTTY)): string {
  const message = error instanceof Error ? error.message : String(error);
  const label = danger('Error:', color);
  return `${label} ${message}`;
}
