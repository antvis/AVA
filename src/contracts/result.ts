import { z } from 'zod';

/** Wire contract for bounded results, including interpreter rows that are not objects. */
const resultShape = z.object({
  schema: z.array(z.object({ name: z.string(), type: z.string().optional() })),
  data: z.array(z.unknown()),
  truncated: z.literal(true).optional(),
  truncatedBy: z.enum(['maxRows', 'maxResultBytes']).optional(),
  rowCount: z.number().int().nonnegative().optional(),
});

export const executionResultSchema = resultShape.loose().superRefine((result, context) => {
  if (Boolean(result.truncated) !== Boolean(result.truncatedBy)) {
    context.addIssue({ code: 'custom', message: 'truncated and truncatedBy must be provided together' });
  }
  if (result.rowCount !== undefined && (result.truncated || result.rowCount !== result.data.length)) {
    context.addIssue({ code: 'custom', path: ['rowCount'], message: 'rowCount must describe a complete result' });
  }
});

/** Engine-native column metadata, derived from the result contract. */
export type QueryColumn = z.output<typeof resultShape>['schema'][number];

/** The wire contract allows any row shape; callers retain their query's row type. */
export type ExecutionResult<T = Record<string, unknown>> = Omit<z.output<typeof resultShape>, 'data'> & { data: T[] };
