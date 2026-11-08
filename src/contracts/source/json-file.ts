import { z } from 'zod';

import { file } from './shared';
import { jsonReadOptionsSchema } from './json';

export const jsonFileSourceSchema = z
  .object({
    type: z.literal('json-file'),
    options: file.extend({ options: jsonReadOptionsSchema.optional() }),
  })
  .strict();

export type JsonFileSourceOptions = z.input<typeof jsonFileSourceSchema>['options'];
