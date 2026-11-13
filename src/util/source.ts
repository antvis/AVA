import { sourceInputSchema } from '../contracts/source';

import type { z } from 'zod';
import type { ParsedDataSourceConfig } from '../types';

const fileSourceTypes = {
  csv: 'csv-file',
  json: 'json-file',
  parquet: 'parquet',
  xlsx: 'excel',
  sqlite: 'sqlite',
  sqlite3: 'sqlite',
  db: 'sqlite',
} as const;

/**
 * Infer file formats without pulling Node's path module into integrations or browser bundles.
 */
export function inferFileSourceType(path: string): (typeof fileSourceTypes)[keyof typeof fileSourceTypes] | undefined {
  const pathname = /^https?:\/\//i.test(path) ? new URL(path).pathname : path;
  const extension = /\.([^./\\]+)$/.exec(pathname)?.[1].toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(fileSourceTypes, extension)) return undefined;
  return fileSourceTypes[extension as keyof typeof fileSourceTypes];
}

/**
 * Find the first candidate absent from the set of lowercase reserved names.
 */
export function findAvailableName(reservedNames: ReadonlySet<string>, nextCandidate: () => string): string {
  let name = nextCandidate();
  while (reservedNames.has(name.toLowerCase())) name = nextCandidate();
  return name;
}

/**
 * Keep the first occurrence of each explicit name and assign unused `dataN`
 * names to the remaining sources.
 */
function assignSourceNames(sources: z.output<typeof sourceInputSchema>[], reserved: readonly string[]) {
  const assignedNames = new Set(reserved.map((name) => name.toLowerCase()));
  const reservedNames = new Set(assignedNames);
  for (const { name } of sources) {
    if (name !== undefined) reservedNames.add(name.toLowerCase());
  }
  let nextDataIndex = 1;

  return sources.map((source) => {
    let { name } = source;
    if (name === undefined || assignedNames.has(name.toLowerCase())) {
      name = findAvailableName(reservedNames, () => `data${nextDataIndex++}`);
    }
    assignedNames.add(name.toLowerCase());
    return { ...source, name };
  });
}

/**
 * Normalize a single source or a batch into a validated list.
 */
export function parseSourceConfigs(input: unknown, reservedNames: readonly string[] = []): ParsedDataSourceConfig[] {
  const configs = Array.isArray(input) ? input : [input];
  if (configs.length === 0) throw new Error('At least one data source is required');

  return assignSourceNames(
    Array.from(configs, (config) => sourceInputSchema.parse(config)),
    reservedNames
  );
}
