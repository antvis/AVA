import { z } from 'zod';

import { jsonValue } from './shared/json';

const logicalTypeSchema = z.enum(['numeric', 'string', 'boolean', 'date', 'unknown']);
const columnSchema = z.object({
  name: z.string(),
  metrics: z.record(z.string(), jsonValue),
  properties: z.object({ logicalType: logicalTypeSchema }),
});
const modelSchema = z.object({
  name: z.string(),
  metrics: z.record(z.string(), jsonValue),
  columns: z.array(columnSchema),
});

const metricConfigSchema = z.union([z.string(), z.object({ id: z.string() }).catchall(z.unknown())]);
export const profileInputSchema = z.object({ metrics: z.array(metricConfigSchema).optional() }).strict();
export const profileOutputSchema = z.object({ models: z.array(modelSchema) }).strict();
export const profileMetadataSchema = profileOutputSchema;
