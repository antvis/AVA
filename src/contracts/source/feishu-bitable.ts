import { z } from 'zod';

import { text } from './shared';

const feishuBitable = z
  .object({
    url: text.optional(),
    appToken: text.optional(),
    tableId: text.optional(),
    appSecret: text.optional(),
    appId: text.optional(),
  })
  .strict()
  .refine((value) => Boolean(value.url || (value.appToken && value.tableId)), {
    message: "Feishu Bitable sources require either 'url' or both 'appToken' and 'tableId'",
  });

export const feishuBitableSourceSchema = z
  .object({ type: z.literal('feishu-bitable'), options: feishuBitable })
  .strict();

export type FeishuBitableSourceOptions = z.input<typeof feishuBitableSourceSchema>['options'];
