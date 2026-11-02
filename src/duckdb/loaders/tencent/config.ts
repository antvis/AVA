import { z } from 'zod';

export const tencentDocsOptionsSchema = z
  .object({
    fileId: z.string().trim().min(1).max(256),
    sheetId: z.string().trim().min(1).max(256),
    clientId: z.string().trim().min(1).optional(),
    openId: z.string().trim().min(1).optional(),
    accessToken: z.string().trim().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    maxRecords: z.number().int().min(1).max(100000).optional(),
    timeoutMs: z.number().int().min(1).max(110000).optional(),
    maxRetries: z.number().int().min(0).max(5).optional(),
  })
  .strict();
