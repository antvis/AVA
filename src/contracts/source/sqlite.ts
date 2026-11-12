import { z } from 'zod';

import { text } from './shared';

export const sqliteSourceSchema = z
  .object({ type: z.literal('sqlite'), options: z.object({ path: text }).strict() })
  .strict();
