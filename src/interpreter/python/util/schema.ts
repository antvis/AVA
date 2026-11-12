import { z } from 'zod';

import { queryOutputSchema } from '../../../contracts/query';
import { jsonValue } from '../../../contracts/shared/json';
import { csvReadOptionsSchema, csvSourceSchema } from '../../../contracts/source/csv';
import { csvFileSourceSchema } from '../../../contracts/source/csv-file';
import { excelOptionsSchema, excelSheetSchema, excelSourceSchema } from '../../../contracts/source/excel';
import { jsonSourceSchema } from '../../../contracts/source/json';
import { jsonFileSourceSchema } from '../../../contracts/source/json-file';
import { parquetSourceSchema } from '../../../contracts/source/parquet';

/** Validate the JSON output of the generated Python script. */
export const resultSchema = queryOutputSchema.safeExtend({ data: z.array(z.record(z.string(), jsonValue)) }).strip();

// Accept options the generated script can translate to pandas; reject DuckDB-specific options.
const csvOptions = csvReadOptionsSchema
  .pick({
    header: true,
    names: true,
    delim: true,
    quote: true,
    escape: true,
    comment: true,
    skip: true,
    nullstr: true,
    all_varchar: true,
    decimal_separator: true,
    thousands: true,
    encoding: true,
    compression: true,
  })
  .extend({
    delim: z.string().length(1).optional(),
    quote: z.string().length(1).optional(),
    escape: z.string().length(1).optional(),
    comment: z.string().length(1).optional(),
    skip: z.number().int().nonnegative().optional(),
    decimal_separator: z.string().length(1).optional(),
    thousands: z.string().length(1).optional(),
  });

const excelOptions = excelOptionsSchema.extend({
  sheets: z
    .array(excelSheetSchema.pick({ sheet: true, range: true, header: true }))
    .nonempty()
    .refine(
      (sheets) => new Set(sheets.map((sheet) => sheet.sheet)).size === sheets.length,
      'Excel sheet names must be unique'
    )
    .optional(),
});

/** Validate and snapshot configuration; data loading runs in the generated script. */
export const sourceSchema = z
  .discriminatedUnion('type', [
    csvSourceSchema.extend({ options: csvSourceSchema.shape.options.extend({ options: csvOptions.optional() }) }),
    jsonSourceSchema.extend({
      options: jsonSourceSchema.shape.options
        .omit({ options: true })
        .extend({ data: z.array(z.record(z.string(), jsonValue)) }),
    }),
    csvFileSourceSchema.extend({
      options: csvFileSourceSchema.shape.options.extend({ options: csvOptions.optional() }),
    }),
    jsonFileSourceSchema.extend({ options: jsonFileSourceSchema.shape.options.omit({ options: true }) }),
    excelSourceSchema.extend({ options: excelOptions }),
    parquetSourceSchema,
  ])
  .superRefine(({ options }, ctx) => {
    if (!('path' in options)) return;

    const { path, headers } = options;
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(path) && !/^[a-z]:[\\/]/i.test(path);

    if (hasScheme) {
      try {
        if (!['http:', 'https:'].includes(new URL(path).protocol)) throw new Error();
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options', 'path'],
          message: 'Python file sources support local paths and HTTP(S) URLs only',
        });
      }
    }

    if (headers && !/^https?:\/\//i.test(path)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options', 'headers'],
        message: 'HTTP headers require an HTTP(S) URL',
      });
    }
  });

/** Return table metadata through the same bounded ExecutionResult protocol as queries. */
export const SCHEMA_CODE = `import numpy as np

def field_type(series):
    dtype = str(series.dtype)
    if not pd.api.types.is_object_dtype(series.dtype):
        return dtype

    observed = set()
    has_arrays = False
    # Bounded observations describe actual cell containers, not an exhaustive schema.
    for value in series.dropna().head(32):
        kind = type(value).__module__ + '.' + type(value).__name__
        if isinstance(value, (np.ndarray, list, tuple)):
            has_arrays = True
            items = pd.api.types.infer_dtype(list(value)[:32], skipna=True)
            kind += '[items: ' + items + ']'
        observed.add(kind)

    return dtype + ' (observed cell types, up to 32 non-null cells: ' + ', '.join(sorted(observed)) + ')' if has_arrays else dtype

result = [
    {'name': name, 'tableReference': {'table': name},
     'columns': [{'name': column, 'type': field_type(frame[column])} for column in frame.columns]}
    for name, frame in tables.items()
]`;

export const tableSchema = z
  .object({
    name: z.string(),
    tableReference: z.object({ table: z.string() }),
    columns: z.array(z.object({ name: z.string(), type: z.string() })),
  })
  .refine(
    (table) => new Set(table.columns.map((f) => f.name)).size === table.columns.length,
    'Invalid Python table columns'
  );
