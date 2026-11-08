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

/** A field type shared by all engines. */
export type LogicalType = z.output<typeof logicalTypeSchema>;
export type MetricConfig = z.input<typeof metricConfigSchema>;
export type MetricId = Exclude<MetricConfig, string>['id'];
export type ProfileInput = z.input<typeof profileInputSchema>;
export type ProfileOutput = z.output<typeof profileOutputSchema>;
/** Metrics to compute; the default set is used when omitted. */
export type ProfileOptions = ProfileInput;
/** Checked metric configs with defaults filled in. */
export type ParsedProfileOptions = { metrics: Exclude<MetricConfig, string>[] };
/** Observations matched to models and columns by name, independently of catalog discovery. */
export type Profile = ProfileOutput;
