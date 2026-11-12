import { z } from 'zod';

export const githubOptionsSchema = z
  .object({
    repository: z.string().trim().min(1),
    token: z.string().trim().min(1).optional(),
    since: z.string().trim().min(1).optional(),
    maxRecords: z.number().int().min(1).max(100000).optional(),
    timeoutMs: z.number().int().min(1).max(110000).optional(),
  })
  .strict();

export const githubSourceSchema = z.object({ type: z.literal('github'), options: githubOptionsSchema }).strict();
