import { z } from 'zod';

import { text, port } from './shared';

import type { ClickHouseClientConfigOptions } from '@clickhouse/client';

const clickhouse = z
  .object({
    host: text.optional(),
    url: text.optional(),
    database: text,
    port,
    user: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    access_token: z.string().optional(),
    pathname: text.optional(),
    application: z.string().optional(),
    session_id: z.string().optional(),
    role: z.union([text, z.array(text)]).optional(),
    http_headers: z.record(z.string(), z.string()).optional(),
    request_timeout: z.number().int().positive().optional(),
  })
  .passthrough()
  .refine((value) => value.host || value.url, { message: "ClickHouse sources require either 'host' or 'url'" });

export const clickhouseSourceSchema = z.object({ type: z.literal('clickhouse'), options: clickhouse }).strict();

type ClickHouseFields = z.input<ReturnType<typeof clickhouse.strip>>;

/** Native client options keep their SDK types, including agents, TLS buffers and callbacks.
 * The runtime schema validates AVA's connection fields and passes native options to the client.
 */
export type ClickHouseSourceOptions = ClickHouseFields & Omit<ClickHouseClientConfigOptions, keyof ClickHouseFields>;
