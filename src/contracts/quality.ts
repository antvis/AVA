import { z } from 'zod';

const rule = z.enum([
  'constant',
  'duplicates',
  'empty',
  'high_cardinality',
  'high_correlation',
  'imbalance',
  'infinite',
  'missing',
  'skewed',
  'unique',
  'unsupported',
  'zeros',
]);
const ratio = z.number().min(0).max(1);

export const qualityInputSchema = z
  .object({
    rules: z.array(rule).optional(),
    ratioThreshold: ratio.default(0.01),
    cardinalityThreshold: z.number().int().nonnegative().default(50),
    correlationThreshold: ratio.default(0.9),
    imbalanceThreshold: ratio.default(0.5),
    skewnessThreshold: z.number().nonnegative().default(20),
  })
  .strict();

const alert = z
  .object({
    rule,
    column: z.string().optional(),
    relatedColumn: z.string().optional(),
    value: z.number().optional(),
    threshold: z.number().optional(),
  })
  .strict();

export const qualityOutputSchema = z
  .object({
    models: z.array(z.object({ name: z.string(), alerts: z.array(alert) }).strict()),
  })
  .strict();
