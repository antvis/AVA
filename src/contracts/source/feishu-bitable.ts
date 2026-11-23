import { z } from 'zod';

import { text } from './shared';

/**
 * Feishu (Lark) Bitable read through the Bitable Open API. A named table becomes the
 * `data` table; otherwise every table of the base is loaded under its own name.
 * Provide exactly one credential: appId with appSecret, or accessToken.
 */
const feishuBitable = z
  .object({
    /** `/base/<appToken>` or `/wiki/<nodeToken>` link; `?table=` selects one table. */
    url: text.optional(),
    /** Bitable app token, the path segment after `/base/`. */
    appToken: text.optional(),
    /** Table to load. Omit it, and `?table=` in the url, to load the whole base. */
    tableId: text.optional(),
    /** Load only the records visible in this view of the table; requires a table. */
    viewId: text.optional(),
    /** Internal app credentials, exchanged for a tenant access token. */
    appId: text.optional(),
    appSecret: text.optional(),
    /** Tenant or user access token obtained by the host application. */
    accessToken: text.optional(),
    /** IANA time zone for date values. Defaults to the time zone of the base. */
    timeZone: text.optional(),
  })
  .strict()
  .refine((value) => Boolean(value.url || value.appToken), {
    message: "Feishu Bitable sources require either 'url' or 'appToken'",
  });

export const feishuBitableSourceSchema = z
  .object({ type: z.literal('feishu-bitable'), options: feishuBitable })
  .strict();
