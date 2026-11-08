/** Tool schemas should use z.toJSONSchema(schema, { io: 'input' }) to describe input before normalization. */
import { z } from 'zod';

import { excelOptionsSchema, excelSheetSchema } from '../util/excel';

import { csvReadOptionsSchema, jsonReadOptionsSchema } from './read-options';

import type { ClickHouseClientConfigOptions } from '@clickhouse/client';

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

// ── Source variants ───────────────────────────────────────────────────────────
// Engines reuse these shapes and narrow only the options they can execute.
export const sourceSchemas = {
  'csv-file': z
    .object({
      type: z.literal('csv-file'),
      options: file.extend({ options: csvReadOptionsSchema.optional() }),
    })
    .strict(),
  'json-file': z
    .object({
      type: z.literal('json-file'),
      options: file.extend({ options: jsonReadOptionsSchema.optional() }),
    })
    .strict(),
  parquet: z.object({ type: z.literal('parquet'), options: file }).strict(),
  excel: z.object({ type: z.literal('excel'), options: excelOptionsSchema }).strict(),
  sqlite: z.object({ type: z.literal('sqlite'), options: z.object({ path: text }).strict() }).strict(),
  csv: z
    .object({
      type: z.literal('csv'),
      options: z.object({ csv: text, options: csvReadOptionsSchema.optional() }).strict(),
    })
    .strict(),
  json: z
    .object({
      type: z.literal('json'),
      options: z
        .object({
          data: z.array(z.record(z.string(), z.unknown())),
          options: jsonReadOptionsSchema.optional(),
        })
        .strict(),
    })
    .strict(),
  text: z.object({ type: z.literal('text'), options: z.object({ text }).strict() }).strict(),
  mysql: z.object({ type: z.literal('mysql'), options: database }).strict(),
  mongodb: z
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
  postgresql: z
    .object({ type: z.literal('postgresql'), options: database.extend({ schema: text.optional() }) })
    .strict(),
  supabase: z
    .object({ type: z.literal('supabase'), options: z.object({ accessToken: text, projectRef: text }).strict() })
    .strict(),
  clickhouse: z.object({ type: z.literal('clickhouse'), options: clickhouse }).strict(),
  sqlserver: z.object({ type: z.literal('sqlserver'), options: sqlserver }).strict(),
  'feishu-bitable': z.object({ type: z.literal('feishu-bitable'), options: feishuBitable }).strict(),
};

export const sourceConfigSchema = z.discriminatedUnion('type', [
  sourceSchemas['csv-file'],
  sourceSchemas['json-file'],
  sourceSchemas.parquet,
  sourceSchemas.excel,
  sourceSchemas.sqlite,
  sourceSchemas.csv,
  sourceSchemas.json,
  sourceSchemas.text,
  sourceSchemas.mysql,
  sourceSchemas.mongodb,
  sourceSchemas.postgresql,
  sourceSchemas.supabase,
  sourceSchemas.clickhouse,
  sourceSchemas.sqlserver,
  sourceSchemas['feishu-bitable'],
]);

// ── Public types ──────────────────────────────────────────────────────────────
// Input types keep normalized/defaulted fields (such as Excel header) optional.
type SourceInput = z.input<typeof sourceConfigSchema>;
type ClickHouseInput = z.input<typeof sourceSchemas.clickhouse>;
type ClickHouseFields = z.input<ReturnType<typeof clickhouse.strip>>;

/** Native client options keep their SDK types, including agents, TLS buffers and callbacks.
 * The runtime schema validates AVA's connection fields and passes native options to the client.
 */
export type ClickHouseSourceOptions = ClickHouseFields & Omit<ClickHouseClientConfigOptions, keyof ClickHouseFields>;
export type DataSourceConfig =
  | Exclude<SourceInput, ClickHouseInput>
  | (Omit<ClickHouseInput, 'options'> & {
      options: ClickHouseSourceOptions;
    });
export type SourceType = DataSourceConfig['type'];
export type CSVReadOptions = z.input<typeof csvReadOptionsSchema>;
export type JSONReadOptions = z.input<typeof jsonReadOptionsSchema>;
export type CSVSourceOptions = Extract<DataSourceConfig, { type: 'csv' }>['options'];
export type CSVFileSourceOptions = Extract<DataSourceConfig, { type: 'csv-file' }>['options'];
export type JsonSourceOptions = Extract<DataSourceConfig, { type: 'json' }>['options'];
export type JsonFileSourceOptions = Extract<DataSourceConfig, { type: 'json-file' }>['options'];
export type ParquetSourceOptions = Extract<DataSourceConfig, { type: 'parquet' }>['options'];
export type ExcelSourceOptions = Extract<DataSourceConfig, { type: 'excel' }>['options'];
export type ExcelSheetOptions = z.input<typeof excelSheetSchema>;
export type ExcelReadOptions = Omit<ExcelSheetOptions, 'sheet'>;
export type TextSourceOptions = Extract<DataSourceConfig, { type: 'text' }>['options'];
export type MySQLSourceOptions = Extract<DataSourceConfig, { type: 'mysql' }>['options'];
export type SSHOptions = NonNullable<MySQLSourceOptions['ssh']>;
export type SQLiteSourceOptions = Extract<DataSourceConfig, { type: 'sqlite' }>['options'];
export type PostgreSQLSourceOptions = Extract<DataSourceConfig, { type: 'postgresql' }>['options'];
export type MongoDBSourceOptions = Extract<DataSourceConfig, { type: 'mongodb' }>['options'];
export type SupabaseSourceOptions = Extract<DataSourceConfig, { type: 'supabase' }>['options'];
export type FeishuBitableSourceOptions = Extract<DataSourceConfig, { type: 'feishu-bitable' }>['options'];
export type SQLServerSourceOptions = Extract<DataSourceConfig, { type: 'sqlserver' }>['options'];
