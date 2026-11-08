import { z } from 'zod';

/** Wire contract for bounded results, including interpreter rows that are not objects. */
const resultShape = z.object({
  schema: z.array(z.object({ name: z.string(), type: z.string().optional() })),
  data: z.array(z.unknown()),
  truncated: z.literal(true).optional(),
  truncatedBy: z.enum(['maxRows', 'maxResultBytes']).optional(),
  rowCount: z.number().int().nonnegative().optional(),
});

/** SDK limits are normalized by the engine; transport-specific caps belong to adapters. */
export const executionOptionsSchema = z
  .object({
    /** Maximum rows returned. Default 200; hard limit 1,000,000. */
    maxRows: z.number().optional(),
    /** Maximum serialized UTF-8 bytes returned. Default 1 MiB. */
    maxResultBytes: z.number().optional(),
  })
  .strict();
export const queryInputSchema = z.object({ dsl: z.string(), options: executionOptionsSchema.optional() }).strict();
export const queryOutputSchema = resultShape.loose().superRefine((result, context) => {
  if (Boolean(result.truncated) !== Boolean(result.truncatedBy)) {
    context.addIssue({ code: 'custom', message: 'truncated and truncatedBy must be provided together' });
  }
  if (result.rowCount !== undefined && (result.truncated || result.rowCount !== result.data.length)) {
    context.addIssue({ code: 'custom', path: ['rowCount'], message: 'rowCount must describe a complete result' });
  }
});

export const executionResultSchema = queryOutputSchema;

/** Engine-native column metadata, derived from the result contract. */
export type QueryColumn = z.output<typeof queryOutputSchema>['schema'][number];
export type QueryInput = z.input<typeof queryInputSchema>;
/** The envelope allows any row shape; callers retain their query's row type. */
export type QueryOutput<T = unknown> = Omit<z.output<ReturnType<typeof queryOutputSchema.strip>>, 'data'> & {
  data: T[];
};
export type ExecutionResult<T = Record<string, unknown>> = QueryOutput<T>;
export type ExecutionOptions = z.input<typeof executionOptionsSchema>;
