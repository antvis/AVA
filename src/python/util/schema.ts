import { z } from 'zod';

export const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number().finite(), z.boolean(), z.null(), z.array(jsonValue), z.record(jsonValue)])
);

/** Validate the JSON output of the generated Python script. */
export const resultSchema = z
  .object({
    data: z.array(z.record(jsonValue)),
    schema: z.array(z.object({ name: z.string(), type: z.string().optional() })),
    truncated: z.literal(true).optional(),
    truncatedBy: z.enum(['maxRows', 'maxResultBytes']).optional(),
    rowCount: z.number().int().nonnegative().optional(),
  })
  .refine(
    (result) =>
      Boolean(result.truncated) === Boolean(result.truncatedBy) &&
      (result.rowCount === undefined || (!result.truncated && result.rowCount === result.data.length)),
    'Invalid Python execution result metadata'
  );

// Accept options the generated script can translate to pandas; reject DuckDB-specific options.
const csvOptions = z
  .object({
    header: z.boolean().optional(),
    names: z.array(z.string()).optional(),
    delim: z.string().length(1).optional(),
    quote: z.string().length(1).optional(),
    escape: z.string().length(1).optional(),
    comment: z.string().length(1).optional(),
    skip: z.number().int().nonnegative().optional(),
    nullstr: z.union([z.string(), z.array(z.string())]).optional(),
    all_varchar: z.boolean().optional(),
    decimal_separator: z.string().length(1).optional(),
    thousands: z.string().length(1).optional(),
    encoding: z.string().optional(),
    compression: z.string().optional(),
  })
  .strict();

const fileOptions = z.object({ path: z.string().min(1), headers: z.record(z.string()).optional() }).strict();

/** Validate and snapshot configuration; data loading runs in the generated script. */
export const sourceSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('csv'),
      options: z.object({ csv: z.string(), options: csvOptions.optional() }).strict(),
    }),
    z.object({ type: z.literal('json'), options: z.object({ data: z.array(z.record(jsonValue)) }).strict() }),
    z.object({ type: z.literal('csv-file'), options: fileOptions.extend({ options: csvOptions.optional() }) }),
    z.object({ type: z.literal('json-file'), options: fileOptions }),
    z.object({ type: z.literal('excel'), options: fileOptions }),
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
export const SCHEMA_CODE = `result = [
    {'name': name, 'columnCount': len(frame.columns), 'indexes': [],
     'fields': [{'name': column, 'type': str(dtype)} for column, dtype in frame.dtypes.items()]}
    for name, frame in tables.items()
]`;

export const tableSchema = z
  .object({
    name: z.string(),
    columnCount: z.number().int().nonnegative(),
    indexes: z.array(z.never()),
    fields: z.array(z.object({ name: z.string(), type: z.string() })),
  })
  .refine(
    (table) =>
      table.columnCount === table.fields.length &&
      new Set(table.fields.map((f) => f.name)).size === table.fields.length,
    'Invalid Python table columns'
  );

export const profileSchema = z.array(
  tableSchema.and(
    z.object({
      metrics: z.record(jsonValue),
      fields: z.array(
        z.object({
          logicalType: z.enum(['numeric', 'string', 'boolean', 'date', 'unknown']),
          metrics: z.record(jsonValue),
        })
      ),
    })
  )
);
