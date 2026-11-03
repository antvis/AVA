import { z } from 'zod';

import { text } from './shared';

const mockTable = z
  .object({
    name: text,
    schema: text.optional(),
    columns: z.array(z.object({ name: text, type: text, notNull: z.boolean().optional() })),
    primaryKey: z.union([text, z.array(text)]).optional(),
    rows: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .strict();

const bigquery = z
  .object({
    projectId: text,
    dataset: text.optional(),
    credentials: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    clientEmail: text.optional(),
    privateKey: text.optional(),
    location: text.optional(),
    maxBytesBilled: z.number().int().nonnegative().optional(),
    timeoutMs: z.number().int().positive().optional(),
    defaultRowLimit: z.number().int().positive().optional(),
    adapter: z.enum(['@google-cloud/bigquery', 'mock']).optional(),
    tables: z.array(mockTable).optional(),
  })
  .strict();

export const bigquerySourceSchema = z.object({ type: z.literal('bigquery'), options: bigquery }).strict();
