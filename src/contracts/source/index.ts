/** Tool schemas should use z.toJSONSchema(schema, { io: 'input' }) to describe input before normalization. */
import { z } from 'zod';

import { csvFileSourceSchema } from './csv-file';
import { jsonFileSourceSchema } from './json-file';
import { parquetSourceSchema } from './parquet';
import { excelSourceSchema } from './excel';
import { sqliteSourceSchema } from './sqlite';
import { csvSourceSchema } from './csv';
import { jsonSourceSchema } from './json';
import { textSourceSchema } from './text';
import { mysqlSourceSchema } from './mysql';
import { mongodbSourceSchema } from './mongodb';
import { postgresqlSourceSchema } from './postgresql';
import { supabaseSourceSchema } from './supabase';
import { clickhouseSourceSchema } from './clickhouse';
import { sqlserverSourceSchema } from './sqlserver';
import { snowflakeSourceSchema } from './snowflake';
import { feishuBitableSourceSchema } from './feishu-bitable';

import type { ClickHouseSourceOptions } from './clickhouse';
import type { SnowflakeSourceOptions } from './snowflake';

/** Engines reuse these shapes and narrow only the options they can execute. */
export const sourceSchemas = {
  'csv-file': csvFileSourceSchema,
  'json-file': jsonFileSourceSchema,
  parquet: parquetSourceSchema,
  excel: excelSourceSchema,
  sqlite: sqliteSourceSchema,
  csv: csvSourceSchema,
  json: jsonSourceSchema,
  text: textSourceSchema,
  mysql: mysqlSourceSchema,
  mongodb: mongodbSourceSchema,
  postgresql: postgresqlSourceSchema,
  supabase: supabaseSourceSchema,
  clickhouse: clickhouseSourceSchema,
  sqlserver: sqlserverSourceSchema,
  snowflake: snowflakeSourceSchema,
  'feishu-bitable': feishuBitableSourceSchema,
};

/** Shared runtime contract for built-in source configurations. */
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
  sourceSchemas.snowflake,
  sourceSchemas['feishu-bitable'],
]);

// Input types keep normalized/defaulted fields (such as Excel header) optional.
type SourceConfigInput = z.input<typeof sourceConfigSchema>;
type ClickHouseInput = z.input<typeof sourceSchemas.clickhouse>;
type SnowflakeInput = z.input<typeof sourceSchemas.snowflake>;
export type DataSourceConfig =
  | Exclude<SourceConfigInput, ClickHouseInput | SnowflakeInput>
  | (Omit<ClickHouseInput, 'options'> & {
      options: ClickHouseSourceOptions;
    })
  | (Omit<SnowflakeInput, 'options'> & { options: SnowflakeSourceOptions });
export const sourceInputSchema = sourceConfigSchema;
/** Native client option types supplement the fields inferred from the runtime schema. */
export type SourceInput = DataSourceConfig;
export type SourceType = DataSourceConfig['type'];

export type { CSVFileSourceOptions } from './csv-file';
export type { JsonFileSourceOptions } from './json-file';
export type { ParquetSourceOptions } from './parquet';
export type { ExcelSourceOptions } from './excel';
export type { SQLiteSourceOptions } from './sqlite';
export type { CSVSourceOptions, CSVReadOptions } from './csv';
export type { JsonSourceOptions, JSONReadOptions } from './json';
export type { TextSourceOptions } from './text';
export type { MySQLSourceOptions } from './mysql';
export type { MongoDBSourceOptions } from './mongodb';
export type { PostgreSQLSourceOptions } from './postgresql';
export type { SupabaseSourceOptions } from './supabase';
export type { ClickHouseSourceOptions } from './clickhouse';
export type { SQLServerSourceOptions } from './sqlserver';
export type { SnowflakeSourceOptions } from './snowflake';
export type { FeishuBitableSourceOptions } from './feishu-bitable';
export type { SSHOptions } from './shared';
