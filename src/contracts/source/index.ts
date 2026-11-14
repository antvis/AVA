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
import { bigquerySourceSchema } from './bigquery';
import { feishuBitableSourceSchema } from './feishu-bitable';
import { tencentDocsSourceSchema } from './tencent-smartsheet';
import { githubSourceSchema } from './github';
import { notionSourceSchema } from './notion';

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
  bigquery: bigquerySourceSchema,
  'feishu-bitable': feishuBitableSourceSchema,
  'tencent-smartsheet': tencentDocsSourceSchema,
  github: githubSourceSchema,
  notion: notionSourceSchema,
};

/** Shared runtime contract for built-in source configurations. */
export const sourceInputSchema = z.discriminatedUnion('type', [
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
  sourceSchemas.bigquery,
  sourceSchemas['feishu-bitable'],
  sourceSchemas['tencent-smartsheet'],
  sourceSchemas.github,
  sourceSchemas.notion,
]);
