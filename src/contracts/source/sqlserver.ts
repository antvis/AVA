import { z } from 'zod';

import { text, port } from './shared';

const sqlserver = z
  .object({
    host: text,
    port,
    database: text,
    user: text,
    password: text,
    schema: text.optional(),
    encrypt: z.boolean().optional(),
    trustServerCertificate: z.boolean().optional(),
    connectionTimeoutMs: z.number().int().positive().optional(),
    requestTimeoutMs: z.number().int().positive().optional(),
  })
  .strict();

export const sqlserverSourceSchema = z.object({ type: z.literal('sqlserver'), options: sqlserver }).strict();

export type SQLServerSourceOptions = z.input<typeof sqlserverSourceSchema>['options'];
