import { z } from 'zod';

import { file } from './shared';
import { csvReadOptionsSchema } from './csv';

export const csvFileSourceSchema = z
  .object({
    type: z.literal('csv-file'),
    options: file.extend({ options: csvReadOptionsSchema.optional() }),
  })
  .strict();
