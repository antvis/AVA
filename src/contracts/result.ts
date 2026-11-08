import { z } from 'zod';

/** Wire contract for bounded results, including interpreter rows that are not objects. */
export const executionResultSchema = z
  .looseObject({
    schema: z.array(z.object({ name: z.string(), type: z.string().optional() })),
    data: z.array(z.unknown()),
    truncated: z.literal(true).optional(),
    truncatedBy: z.enum(['maxRows', 'maxResultBytes']).optional(),
    rowCount: z.number().int().nonnegative().optional(),
  })
  .superRefine((result, context) => {
    if (Boolean(result.truncated) !== Boolean(result.truncatedBy)) {
      context.addIssue({ code: 'custom', message: 'truncated and truncatedBy must be provided together' });
    }
    if (result.rowCount !== undefined && (result.truncated || result.rowCount !== result.data.length)) {
      context.addIssue({ code: 'custom', path: ['rowCount'], message: 'rowCount must describe a complete result' });
    }
  });
