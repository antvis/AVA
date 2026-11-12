import { z } from 'zod';

import { executionOptionsSchema, queryOutputSchema } from './query';

const strategySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('direct'), maxRetries: z.number().optional() }).strict(),
  z.object({ type: z.literal('loop'), maxSteps: z.number().optional() }).strict(),
]);
export const analysisConfigSchema = executionOptionsSchema.extend({
  /** Defaults to true; false returns empty text. */
  includeSummary: z.boolean().optional(),
  /** Defaults to direct, with two correction retries. */
  strategy: strategySchema.optional(),
});
export const analyzeInputSchema = z.object({ query: z.string(), config: analysisConfigSchema.optional() }).strict();
export const analyzeOutputSchema = queryOutputSchema.safeExtend({
  query: z.string(),
  text: z.string(),
  markdown: z.string().optional(),
  sql: z.string().optional(),
});
