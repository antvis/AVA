import { z } from 'zod';

/** Native DuckDB read_csv options; omitted fields use reader defaults. */
export const csvReadOptionsSchema = z
  .object({
    // ── structure / columns ─────────────────────
    /** First line of each file contains the column names. Default false */
    header: z.boolean().optional(),
    /** Column names, as a list */
    names: z.array(z.string()).optional(),
    /** Column names → types struct, e.g. { col1: 'INTEGER' }. Disables schema auto-detection */
    columns: z.record(z.string(), z.string()).optional(),
    /** Column types, by position (list) or by name (struct) */
    types: z.union([z.array(z.string()), z.record(z.string(), z.string())]).optional(),
    /** Skip type detection and read all columns as VARCHAR. Default false */
    all_varchar: z.boolean().optional(),
    /** Remove non-alphanumeric chars from column names; prefix reserved keywords with _ */
    normalize_names: z.boolean().optional(),
    /** Columns that must not be matched against the NULL string */
    force_not_null: z.array(z.string()).optional(),

    // ── delimiter / quoting ─────────────────────
    /** Field delimiter (up to 4 bytes). Default ',' */
    delim: z.string().optional(),
    /** Quote character. Default '"' */
    quote: z.string().optional(),
    /** Escape character for the quote within quoted values. Default '"' */
    escape: z.string().optional(),
    /** Character used to initiate comments */
    comment: z.string().optional(),
    /** New line character(s): '\r' | '\n' | '\r\n' */
    new_line: z.string().optional(),

    // ── type detection / formats ────────────────
    /** Auto detect CSV parameters. Default true */
    auto_detect: z.boolean().optional(),
    /** Types the sniffer considers when detecting column types, e.g. ['BIGINT', 'DATE'] */
    auto_type_candidates: z.array(z.string()).optional(),
    /** Date format used when parsing dates */
    dateformat: z.string().optional(),
    /** Timestamp format used when parsing timestamps */
    timestampformat: z.string().optional(),
    /** Decimal separator for numbers. Default '.' */
    decimal_separator: z.string().optional(),
    /** Thousands separator (single char, different from decimal_separator) */
    thousands: z.string().optional(),
    /** String(s) that represent a NULL value */
    nullstr: z.union([z.string(), z.array(z.string())]).optional(),
    /** Allow the conversion of quoted values to NULL. Default true */
    allow_quoted_nulls: z.boolean().optional(),

    // ── sampling / performance ──────────────────
    /** Number of sample lines for auto detection. Default 20480 */
    sample_size: z.number().optional(),
    /** Size of the read buffers in bytes. Default 16 * max_line_size */
    buffer_size: z.number().optional(),
    /** Files used by the sniffer for multi-file schema detection; -1 = all. Default 10 */
    files_to_sniff: z.number().optional(),
    /** Maximum line size in bytes. Default 2000000 */
    max_line_size: z.number().optional(),
    /** Use the parallel CSV reader. Default true */
    parallel: z.boolean().optional(),
    /** Number of lines to skip at the start of each file. Default 0 */
    skip: z.number().optional(),

    // ── error handling / rejects ────────────────
    /** Ignore any parsing errors encountered. Default false */
    ignore_errors: z.boolean().optional(),
    /** Pad short rows with NULL values on the right. Default false */
    null_padding: z.boolean().optional(),
    /** Throw an error upon encountering any issue. Default true */
    strict_mode: z.boolean().optional(),
    /** Skip faulty lines and store them in the rejects table. Default false */
    store_rejects: z.boolean().optional(),
    /** Temp table name for faulty lines. Default 'reject_errors' */
    rejects_table: z.string().optional(),
    /** Temp table name for faulty scans. Default 'reject_scans' */
    rejects_scan: z.string().optional(),
    /** Upper limit on faulty lines recorded per file; 0 = no limit. Default 0 */
    rejects_limit: z.number().optional(),

    // ── encoding / compression ──────────────────
    /** File encoding (default 'utf-8'). Others such as 'gb18030' require the DuckDB encodings extension. */
    encoding: z.string().optional(),
    /** Compression method: 'none' | 'gzip' | 'zstd'. Default auto (from file extension) */
    compression: z.string().optional(),

    // ── multiple files ──────────────────────────
    /** Align columns from different files by name instead of position. Default false */
    union_by_name: z.boolean().optional(),
    /** Interpret the path as a Hive partitioned path. Default auto-detected */
    hive_partitioning: z.boolean().optional(),
    /** Add the source file path to each row as a `filename` column. Default false */
    filename: z.boolean().optional(),
  })
  .strict();

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
