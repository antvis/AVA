import { z } from 'zod';

const rowShape = z.record(z.string(), z.unknown());

// Validate without z.record's key stripping, then copy own keys without invoking prototype setters.
export const dataRowSchema = z
  .preprocess(
    (row: Record<string, unknown>) => row,
    z
      .unknown()
      .refine(rowShape.validate, { message: 'Expected an object row', abort: true })
      .overwrite((row) => Object.fromEntries(Object.entries(row)))
  )
  .meta({ type: 'object', additionalProperties: {} });

export const jsonValue = z.json();
