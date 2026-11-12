import { z } from 'zod';

import { database, text } from './shared';

export const postgresqlSourceSchema = z
  .object({ type: z.literal('postgresql'), options: database.extend({ schema: text.optional() }) })
  .strict();
