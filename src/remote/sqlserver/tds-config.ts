/**
 * Build the tedious connection config from SqlServerSourceOptions. This file
 * declares only structural types and never imports the tedious package so it
 * type-checks and tree-shakes even when the driver is absent (only a runtime
 * `require('tedious')` path requires the dependency).
 */
import type { SqlServerSourceOptions } from '../../types';

/** Structural subset of tedious' ConnectionConfiguration used to build config. */
export interface TediousConnectionConfig {
  server: string;
  authentication?: { type: 'default'; options: { userName?: string; password?: string } };
  options: {
    database?: string;
    port?: number;
    instanceName?: string;
    encrypt?: boolean;
    trustServerCertificate?: boolean;
    connectTimeout?: number;
    requestTimeout?: number;
    appName?: string;
    readOnlyIntent?: boolean;
    rowCollectionOnRequestCompletion?: boolean;
  };
}

const DEFAULT_PORT = 1433;
const DEFAULT_REQUEST_TIMEOUT = 30_000;
const DEFAULT_CONNECT_TIMEOUT = 15_000;

export function resolveTdsConfig(options: SqlServerSourceOptions): TediousConnectionConfig {
  const {
    server,
    port,
    instanceName,
    database,
    user,
    password,
    encrypt,
    trustServerCertificate,
    requestTimeout,
    connectTimeout,
  } = options;

  if (!server) throw new Error('SQL Server source options require a server');
  if (!database) throw new Error('SQL Server source options require a database');

  const config: TediousConnectionConfig = {
    server,
    options: {
      database,
      // Selecting a failover partner with ApplicationIntent=ReadOnly is the
      // closest a login-instead-of-AAG setup gets to read-only: it picks a
      // read replica when one exists and refuses write traffic to the primary.
      readOnlyIntent: true,
      appName: 'ava',
      port: port ?? DEFAULT_PORT,
      encrypt: encrypt ?? true,
      trustServerCertificate: trustServerCertificate ?? false,
      requestTimeout: requestTimeout ?? DEFAULT_REQUEST_TIMEOUT,
      connectTimeout: connectTimeout ?? DEFAULT_CONNECT_TIMEOUT,
    },
  };

  if (user !== undefined || password !== undefined) {
    config.authentication = { type: 'default', options: { userName: user, password } };
  }

  if (instanceName) {
    if (port !== undefined) {
      throw new Error('instanceName and port are mutually exclusive for SQL Server sources');
    }
    config.options.instanceName = instanceName;
    config.options.port = undefined;
  }

  return config;
}