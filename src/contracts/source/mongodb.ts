import { z } from 'zod';

import { text, port } from './shared';

export const mongodbSourceSchema = z
  .object({
    type: z.literal('mongodb'),
    options: z
      .object({
        connection: text.optional(),
        host: text.optional(),
        database: text,
        port,
        user: z.string().optional(),
        password: z.string().optional(),
        authSource: z.string().optional(),
        srv: z.boolean().optional(),
        tls: z.boolean().optional(),
        ssl: z.boolean().optional(),
        tlsCAFile: z.string().optional(),
        tlsAllowInvalidCertificates: z.boolean().optional(),
      })
      .strict(),
  })
  .strict();

export type MongoDBSourceOptions = z.input<typeof mongodbSourceSchema>['options'];
