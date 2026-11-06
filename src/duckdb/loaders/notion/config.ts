import { z } from 'zod';

export const notionOptionsSchema = z
  .object({
    /** Notion database id (UUID). */
    databaseId: z.string().trim().min(1).max(200),
    /** Integration/bot token; overrides NOTION_TOKEN. */
    token: z.string().trim().min(1).optional(),
    /** Pages per query request, 1–100. Default 100. */
    pageSize: z.number().int().min(1).max(100).optional(),
    /** Fail instead of truncating. Default 10,000; max 100,000, also bounded by expanded snapshot budgets. */
    maxRecords: z.number().int().min(1).max(100000).optional(),
    /** Whole-load deadline, including pagination and retries. Default 60,000 ms. */
    timeoutMs: z.number().int().min(1).max(110000).optional(),
    /** Retries for transient failures only, 0–5. Default 2. */
    maxRetries: z.number().int().min(0).max(5).optional(),
    /** Notion API version header, e.g. '2022-06-28'. Default '2022-06-28'. */
    version: z.string().trim().min(1).optional(),
  })
  .strict();