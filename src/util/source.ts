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
 * Keep the first occurrence of each explicit name and assign unused `dataN`
 * names to the remaining sources.
 */
function assignSourceNames(sources: z.output<typeof sourceInputSchema>[]) {
  const reservedNames = new Set(sources.map(({ name }) => name?.toLowerCase()));
  const assignedNames = new Set<string>();
  let next = 1;

  return sources.map((source) => {
    let { name } = source;
    if (name === undefined || assignedNames.has(name.toLowerCase())) {
      while (reservedNames.has(`data${next}`)) next += 1;
      name = `data${next}`;
      next += 1;
    }
    assignedNames.add(name.toLowerCase());
    return { ...source, name };
  });
}

/**
 * Normalize a single source or a batch into a validated list.
 */
export function parseSourceConfigs(input: unknown): ParsedDataSourceConfig[] {
  const configs = Array.isArray(input) ? input : [input];
  if (configs.length === 0) throw new Error('At least one data source is required');

  return assignSourceNames(Array.from(configs, (config) => sourceInputSchema.parse(config)));
}
