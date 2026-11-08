import { z } from 'zod';

import { text } from './shared';

import type { ConnectionOptions as SnowflakeConnectionOptions } from 'snowflake-sdk';

// Other snowflake-sdk connection options pass through to the driver.
const snowflake = z
  .object({
    account: text,
    database: text,
    schema: text.optional(),
    warehouse: text.optional(),
    role: text.optional(),
    username: text.optional(),
    authenticator: text.optional(),
    password: z.string().optional(),
    token: z.string().optional(),
    tokenFilePath: text.optional(),
    privateKey: z.string().optional(),
    privateKeyPath: text.optional(),
    privateKeyPass: z.string().optional(),
    queryTimeoutMs: z.number().int().positive().optional(),
  })
  .passthrough();

export const snowflakeSourceSchema = z.object({ type: z.literal('snowflake'), options: snowflake }).strict();

type SnowflakeFields = z.input<ReturnType<typeof snowflake.strip>>;

/** Native driver options exclude the result/session controls owned by AVA. */
export type SnowflakeSourceOptions = SnowflakeFields &
  Omit<
    SnowflakeConnectionOptions,
    | keyof SnowflakeFields
    | 'rowMode'
    | 'streamResult'
    | 'fetchAsString'
    | 'jsTreatIntegerAsBigInt'
    | 'representNullAsStringNull'
    | 'serverSessionKeepAlive'
  >;
