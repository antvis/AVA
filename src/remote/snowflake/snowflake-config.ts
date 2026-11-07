/**
 * Build the snowflake-sdk connection config from SnowflakeSourceOptions. This
 * file declares only structural types and never imports the driver package so
 * it type-checks and tree-shakes even when the driver is absent; only loading
 * the production connector requires the dependency at runtime.
 */
import type { SnowflakeSDKSourceOptions } from '../../types';

/** Structural subset of snowflake-sdk's connection configuration. */
export interface SnowflakeConnectionConfig {
  account: string;
  username: string;
  password?: string;
  database?: string;
  schema?: string;
  warehouse?: string;
  role?: string;
  region?: string;
  host?: string;
  connectionTimeout?: number;
  authenticator?: string;
  privateKey?: string;
  token?: string;
  application: string;
  clientSessionKeepAlive: boolean;
}

const DEFAULT_CONNECTION_TIMEOUT = 30_000;

export function resolveSnowflakeConfig(options: SnowflakeSDKSourceOptions): SnowflakeConnectionConfig {
  const {
    account,
    username,
    password,
    database,
    schema,
    warehouse,
    role,
    region,
    host,
    connectionTimeout,
    authenticator,
    privateKey,
    token,
  } = options;

  if (!account) throw new Error('Snowflake source options require an account');
  if (!username) throw new Error('Snowflake source options require a username');
  if (!database) throw new Error('Snowflake source options require a database');

  return {
    account,
    username,
    database,
    schema: schema ?? 'PUBLIC',
    warehouse,
    role,
    region,
    host,
    connectionTimeout: connectionTimeout ?? DEFAULT_CONNECTION_TIMEOUT,
    authenticator: privateKey ? 'SNOWFLAKE_JWT' : authenticator,
    privateKey,
    token,
    ...(privateKey ? {} : { password }),
    application: 'antv_ava',
    clientSessionKeepAlive: true,
  };
}
