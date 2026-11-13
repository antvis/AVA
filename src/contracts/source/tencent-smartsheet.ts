import { z } from 'zod';

export const tencentSmartsheetOptionsSchema = z
  .object({
    /** Native OpenAPI fileID. */
    fileId: z.string().trim().min(1).max(256),
    sheetId: z.string().trim().min(1).max(256),
    clientId: z.string().trim().min(1),
    openId: z.string().trim().min(1),
    accessToken: z.string().trim().min(1),
    pageSize: z.number().int().min(1).max(100).optional(),
    maxRecords: z.number().int().min(1).max(100000).optional(),
    timeoutMs: z.number().int().min(1).max(110000).optional(),
    maxRetries: z.number().int().min(0).max(5).optional(),
  })
  .strict();

export const tencentSmartsheetSourceSchema = z
  .object({ type: z.literal('tencent-smartsheet'), options: tencentSmartsheetOptionsSchema })
  .strict();
