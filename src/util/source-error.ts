import { AVAError } from './error';

import type { DataSourceConfig } from '../types';

/** Drivers may echo transformed or partial credentials, so literal-string replacement is insufficient. */
export function sourceErrorContext(config: DataSourceConfig): string | undefined {
  if (
    ['mysql', 'postgresql', 'mongodb', 'clickhouse', 'sqlserver', 'supabase', 'feishu-bitable'].includes(config.type)
  ) {
    return config.type;
  }
  if (
    'path' in config.options &&
    typeof config.options.path === 'string' &&
    /^https?:\/\//i.test(config.options.path)
  ) {
    return config.type;
  }
  return undefined;
}

export function safeSourceError(error: unknown, context?: string): unknown {
  if (!context || error instanceof AVAError) return error;
  return new AVAError(
    'SOURCE_ERROR',
    `The ${context} operation failed. Check the query, connection and read permissions.`
  );
}
