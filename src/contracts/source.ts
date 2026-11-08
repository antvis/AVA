/** Tool schemas should use z.toJSONSchema(schema, { io: 'input' }) to describe input before normalization. */
import { z } from 'zod';

import { excelOptionsSchema } from '../util/excel';

/** Shared runtime contract for built-in source configurations; keeps each type correlated with its options. */
const text = z.string().min(1);
const port = z.number().int().min(1).max(65535).optional();
const file = z.object({ path: text, headers: z.record(z.string(), z.string()).optional() }).strict();
const database = z
  .object({
    host: text,
    database: text,
    port,
    user: z.string().optional(),
    password: z.string().optional(),
    ssh: z
      .object({ host: text, user: text, port, password: z.string().optional(), hostKeyFingerprint: text })
      .strict()
      .optional(),
  })
  .strict();
const sqlserver = z
  .object({
    host: text,
    port,
    database: text,
    user: text,
    password: text,
    schema: text.optional(),
    encrypt: z.boolean().optional(),
    trustServerCertificate: z.boolean().optional(),
    connectionTimeoutMs: z.number().int().positive().optional(),
    requestTimeoutMs: z.number().int().positive().optional(),
  })
  .strict();
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

const feishuBitable = z
  .object({
    url: text.optional(),
    appToken: text.optional(),
    tableId: text.optional(),
    appSecret: text.optional(),
    appId: text.optional(),
  })
  .strict()
  .refine((value) => Boolean(value.url || (value.appToken && value.tableId)), {
    message: "Feishu Bitable sources require either 'url' or both 'appToken' and 'tableId'",
  });

export const sourceConfigSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('csv-file'),
      options: file.extend({ options: z.record(z.string(), z.unknown()).optional() }),
    })
    .strict(),
  z
    .object({
      type: z.literal('json-file'),
      options: file.extend({ options: z.record(z.string(), z.unknown()).optional() }),
    })
    .strict(),
  z.object({ type: z.literal('parquet'), options: file }).strict(),
  z.object({ type: z.literal('excel'), options: excelOptionsSchema }).strict(),
  z.object({ type: z.literal('sqlite'), options: z.object({ path: text }).strict() }).strict(),
  z
    .object({
      type: z.literal('csv'),
      options: z.object({ csv: text, options: z.record(z.string(), z.unknown()).optional() }).strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal('json'),
      options: z
        .object({
          data: z.array(z.record(z.string(), z.unknown())),
          options: z.record(z.string(), z.unknown()).optional(),
        })
        .strict(),
    })
    .strict(),
  z.object({ type: z.literal('text'), options: z.object({ text }).strict() }).strict(),
  z.object({ type: z.literal('mysql'), options: database }).strict(),
  z
    .object({
      type: z.literal('mongodb'),
      options: z
        .object({
          connection: text.optional(),
          host: text.optional(),
          database: text,
          port,
          user: z.string().optional(),
          password: z.string().optional(),
          authSource: z.string().optional(),
          srv: z.boolean().optional(),
          tls: z.boolean().optional(),
          ssl: z.boolean().optional(),
          tlsCAFile: z.string().optional(),
          tlsAllowInvalidCertificates: z.boolean().optional(),
        })
        .strict(),
    })
    .strict(),
  z.object({ type: z.literal('postgresql'), options: database.extend({ schema: text.optional() }) }).strict(),
  z
    .object({ type: z.literal('supabase'), options: z.object({ accessToken: text, projectRef: text }).strict() })
    .strict(),
  z.object({ type: z.literal('clickhouse'), options: clickhouse }).strict(),
  z.object({ type: z.literal('sqlserver'), options: sqlserver }).strict(),
  z.object({ type: z.literal('feishu-bitable'), options: feishuBitable }).strict(),
]);

/** Infer file formats without pulling Node's path module into integrations or browser bundles. */
export function inferFileSourceType(path: string) {
  const pathname = /^https?:\/\//i.test(path) ? new URL(path).pathname : path;
  const extension = /\.([^./\\]+)$/.exec(pathname)?.[1].toLowerCase();
  const types = {
    csv: 'csv-file',
    json: 'json-file',
    parquet: 'parquet',
    xlsx: 'excel',
    sqlite: 'sqlite',
    sqlite3: 'sqlite',
    db: 'sqlite',
  } as const;
  return types[extension as keyof typeof types];
}
