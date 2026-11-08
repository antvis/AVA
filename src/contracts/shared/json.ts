import { z } from 'zod';

const rowShape = z.record(z.string(), z.unknown());

// Validate without z.record's key stripping, then copy own keys without invoking prototype setters.
export const dataRowSchema = z
  .preprocess(
    (row: Record<string, unknown>) => row,
    z
      .unknown()
      .refine(rowShape.validate, 'Expected an object row')
      .transform((row) => Object.fromEntries(Object.entries(row)))
  )
  .meta({ type: 'object', additionalProperties: {} });

export const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number().finite(), z.boolean(), z.null(), z.array(jsonValue), z.record(z.string(), jsonValue)])
);

/** Serializable metadata values; numeric finiteness must be checked at runtime. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Extensible metadata whose keys and meanings are agreed on by producers and consumers. */
export type Properties = Record<string, JsonValue>;
