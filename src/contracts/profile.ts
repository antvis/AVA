import { z } from 'zod';

import { jsonValue } from './shared/json';

const logicalTypeSchema = z.enum(['numeric', 'string', 'boolean', 'date', 'unknown']);
const profileTypeSchema = z.enum([
  'Numeric',
  'Categorical',
  'Text',
  'Boolean',
  'DateTime',
  'URL',
  'Path',
  'Unsupported',
]);
const columnSchema = z.object({
  name: z.string(),
  metrics: z.record(z.string(), jsonValue),
  properties: z.object({ logicalType: logicalTypeSchema, profileType: profileTypeSchema.optional() }),
});
const modelSchema = z.object({
  name: z.string(),
  metrics: z.record(z.string(), jsonValue),
  columns: z.array(columnSchema),
});

const metricConfigSchema = z.union([z.string(), z.object({ id: z.string() }).catchall(z.unknown())]);
const semantics = z.literal('data-profiling').optional();
export const profileInputSchema = z
  .object({
    metrics: z.array(metricConfigSchema).optional(),
    semantics,
    typeSchema: z.record(z.string(), z.record(z.string(), profileTypeSchema)).optional(),
  })
  .strict();
export const profileOutputSchema = z.object({ models: z.array(modelSchema), semantics }).strict();
