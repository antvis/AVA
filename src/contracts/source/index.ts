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

/** Shared runtime contract for built-in source configurations. */
export const sourceInputSchema = z.discriminatedUnion('type', [
  csvFileSourceSchema,
  jsonFileSourceSchema,
  parquetSourceSchema,
  excelSourceSchema,
  sqliteSourceSchema,
  csvSourceSchema,
  jsonSourceSchema,
  textSourceSchema,
  mysqlSourceSchema,
  mongodbSourceSchema,
  postgresqlSourceSchema,
  supabaseSourceSchema,
  clickhouseSourceSchema,
  sqlserverSourceSchema,
  snowflakeSourceSchema,
  feishuBitableSourceSchema,
]);
