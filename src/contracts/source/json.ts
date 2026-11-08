import { z } from 'zod';

import { dataRowSchema } from '../shared/json';

/** Native DuckDB read_json options; omitted fields use reader defaults. */
export const jsonReadOptionsSchema = z
  .object({
    /** Infer columns and types. Default true */
    auto_detect: z.boolean().optional(),
    /** Column names mapped to DuckDB types; omitted columns are excluded */
    columns: z.record(z.string(), z.string()).optional(),
    /** Compression codec. Default auto_detect */
    compression: z.enum(['auto_detect', 'none', 'gzip', 'zstd']).optional(),
    /** Date parsing pattern. Default 'iso' */
    dateformat: z.string().optional(),
    /** Average field frequency below which objects become MAPs. Default 0.1 */
    field_appearance_threshold: z.number().optional(),
    /** Include filename in SELECT *. Default false; also available as a virtual column */
    filename: z.boolean().optional(),
    /** Input layout. read_json defaults to auto-detection */
    format: z.enum(['auto', 'unstructured', 'newline_delimited', 'array']).optional(),
    /** Read Hive partitions from paths. Default auto-detected */
    hive_partitioning: z.boolean().optional(),
    /** Skip parse errors; requires newline_delimited format. Default false */
    ignore_errors: z.boolean().optional(),
    /** Subfield count above which STRUCT becomes MAP; -1 disables. Default 200 */
    map_inference_threshold: z.number().optional(),
    /** Inference depth; -1 means unlimited. Default -1 */
    maximum_depth: z.number().optional(),
    /** Object size limit in bytes. Default 16777216 */
    maximum_object_size: z.number().optional(),
    /** File count used for inference. Default 32 */
    maximum_sample_files: z.number().optional(),
    /** Unpack objects into columns. Default 'auto' */
    records: z.enum(['auto', 'true', 'false']).optional(),
    /** Objects sampled for inference; -1 scans all. Default 20480 */
    sample_size: z.number().optional(),
    /** Timestamp parsing pattern. Default 'iso' */
    timestampformat: z.string().optional(),
    /** Merge file schemas by column name. Default false */
    union_by_name: z.boolean().optional(),
  })
  .strict();

export const jsonSourceSchema = z
  .object({
    type: z.literal('json'),
    options: z
      .object({
        data: z.array(dataRowSchema),
        options: jsonReadOptionsSchema.optional(),
      })
      .strict(),
  })
  .strict();

export type JsonSourceOptions = z.input<typeof jsonSourceSchema>['options'];
export type JSONReadOptions = z.input<typeof jsonReadOptionsSchema>;
