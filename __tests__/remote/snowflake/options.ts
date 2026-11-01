import type { SnowflakeSourceOptions } from '../../../src/types';

/**
 * Connection options for the read-only integration-test user, read from environment variables:
 * AVA_SNOWFLAKE_ACCOUNT, AVA_SNOWFLAKE_USER and one credential (AVA_SNOWFLAKE_PRIVATE_KEY_PATH for
 * key-pair authentication, AVA_SNOWFLAKE_TOKEN for a programmatic access token, or
 * AVA_SNOWFLAKE_PASSWORD), plus optional AVA_SNOWFLAKE_WAREHOUSE and AVA_SNOWFLAKE_ROLE.
 */
export function snowflakeOptions(overrides: Partial<SnowflakeSourceOptions> = {}): SnowflakeSourceOptions {
  const env = process.env;
  const credentials: Partial<SnowflakeSourceOptions> = env.AVA_SNOWFLAKE_PRIVATE_KEY_PATH
    ? { authenticator: 'SNOWFLAKE_JWT', privateKeyPath: env.AVA_SNOWFLAKE_PRIVATE_KEY_PATH }
    : env.AVA_SNOWFLAKE_TOKEN
    ? { authenticator: 'PROGRAMMATIC_ACCESS_TOKEN', token: env.AVA_SNOWFLAKE_TOKEN }
    : { password: env.AVA_SNOWFLAKE_PASSWORD };
  return {
    account: env.AVA_SNOWFLAKE_ACCOUNT ?? '',
    username: env.AVA_SNOWFLAKE_USER,
    ...credentials,
    ...(env.AVA_SNOWFLAKE_WAREHOUSE ? { warehouse: env.AVA_SNOWFLAKE_WAREHOUSE } : {}),
    ...(env.AVA_SNOWFLAKE_ROLE ? { role: env.AVA_SNOWFLAKE_ROLE } : {}),
    database: 'AVA_TEST',
    schema: 'SALES',
    ...overrides,
  };
}
