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
import { githubSourceSchema } from './github';

const sourceFields = {
  name: z
    .string()
    .trim()
    .min(1)
    .refine((name) => !name.includes('\0'))
    .optional()
    .catch(undefined),
};

/**
 * Shared runtime contract for built-in source configurations.
 */
export const sourceInputSchema = z.discriminatedUnion('type', [
  csvFileSourceSchema.extend(sourceFields),
  jsonFileSourceSchema.extend(sourceFields),
  parquetSourceSchema.extend(sourceFields),
  excelSourceSchema.extend(sourceFields),
  sqliteSourceSchema.extend(sourceFields),
  csvSourceSchema.extend(sourceFields),
  jsonSourceSchema.extend(sourceFields),
  textSourceSchema.extend(sourceFields),
  mysqlSourceSchema.extend(sourceFields),
  mongodbSourceSchema.extend(sourceFields),
  postgresqlSourceSchema.extend(sourceFields),
  supabaseSourceSchema.extend(sourceFields),
  clickhouseSourceSchema.extend(sourceFields),
  sqlserverSourceSchema.extend(sourceFields),
  snowflakeSourceSchema.extend(sourceFields),
  feishuBitableSourceSchema.extend(sourceFields),
  githubSourceSchema.extend(sourceFields),
]);
