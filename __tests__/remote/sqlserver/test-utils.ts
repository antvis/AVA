import type { SQLServerSourceOptions } from '../../../src/types';

export const sqlserverEnabled = process.env.AVA_SQLSERVER_TEST === '1';

/** Values default to the disposable Compose fixture; real credentials stay in local env/CI secrets. */
export function sqlserverOptions(): SQLServerSourceOptions {
  return {
    host: process.env.AVA_SQLSERVER_TEST_HOST ?? '127.0.0.1',
    port: Number(process.env.AVA_SQLSERVER_TEST_PORT ?? 11433),
    database: process.env.AVA_SQLSERVER_TEST_DATABASE ?? 'ava_sqlserver_test',
    user: process.env.AVA_SQLSERVER_TEST_USER ?? 'ava_reader',
    password: process.env.AVA_SQLSERVER_TEST_PASSWORD ?? 'Sql_fixture_2026!',
    trustServerCertificate: true,
    connectionTimeoutMs: 10000,
    requestTimeoutMs: 30000,
  };
}
