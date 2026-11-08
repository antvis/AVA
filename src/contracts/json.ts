import { z } from 'zod';

export const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number().finite(), z.boolean(), z.null(), z.array(jsonValue), z.record(z.string(), jsonValue)])
);

/** Serializable metadata values; numeric finiteness must be checked at runtime. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Extensible metadata whose keys and meanings are agreed on by producers and consumers. */
export type Properties = Record<string, JsonValue>;
