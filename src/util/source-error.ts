import { AVAError } from './error';

import type { DataSourceConfig } from '../types';

// Only documented driver codes select diagnostics; provider messages may contain credentials.
const queryDiagnostics: Record<string, string> = {
  'postgresql:42601': 'The query has invalid SQL syntax.',
  'postgresql:42703': 'The query references an unknown column.',
  'postgresql:42P01': 'The query references an unknown table.',
  'postgresql:42883': 'The query references an unknown function or incompatible argument types.',
  'postgresql:42804': 'The query uses incompatible data types.',
  'mysql:ER_PARSE_ERROR': 'The query has invalid SQL syntax.',
  'mysql:ER_BAD_FIELD_ERROR': 'The query references an unknown column.',
  'mysql:ER_NO_SUCH_TABLE': 'The query references an unknown table.',
  'clickhouse:62': 'The query has invalid SQL syntax.',
  'clickhouse:47': 'The query references an unknown column.',
  'clickhouse:60': 'The query references an unknown table.',
  'clickhouse:46': 'The query references an unknown function.',
  'clickhouse:53': 'The query uses incompatible data types.',
  'sqlserver:102': 'The query has invalid SQL syntax.',
  'sqlserver:207': 'The query references an unknown column.',
  'sqlserver:208': 'The query references an unknown table.',
};
const authenticationCodes = new Set([
  'postgresql:28P01',
  'postgresql:28000',
  'mysql:ER_ACCESS_DENIED_ERROR',
  'clickhouse:516',
  'sqlserver:18456',
]);

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
  const detail = error && typeof error === 'object' ? (error as Record<string, unknown>) : {};
  const nativeCode = context === 'sqlserver' && typeof detail.number === 'number' ? detail.number : detail.code;
  const key = `${context}:${nativeCode}`;
  if (authenticationCodes.has(key) || (context === 'supabase' && (detail.status === 401 || detail.status === 403))) {
    return new AVAError('AUTHENTICATION_FAILED', `The ${context} service rejected authentication.`);
  }
  if (queryDiagnostics[key]) return new AVAError('QUERY_ERROR', queryDiagnostics[key]);
  if (
    ['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ETIMEOUT', 'ABORT_ERR'].includes(String(detail.code)) ||
    detail.name === 'AbortError'
  ) {
    return new AVAError(
      'REQUEST_TIMEOUT',
      `The ${context} request timed out; the operation may still be running.`,
      'unknown'
    );
  }
  if (['ECONNRESET', 'EPIPE', 'ECONNREFUSED', 'ENOTFOUND'].includes(String(detail.code))) {
    return new AVAError(
      'CONNECTION_LOST',
      `The ${context} connection failed; the operation may still be running.`,
      'unknown'
    );
  }
  return new AVAError(
    'SOURCE_ERROR',
    `The ${context} operation failed. Check the query, connection and read permissions.`
  );
}
