import { z } from 'zod';

export const text = z.string().min(1);
export const port = z.number().int().min(1).max(65535).optional();
export const file = z.object({ path: text, headers: z.record(z.string(), z.string()).optional() }).strict();
export const database = z
  .object({
    host: text,
    database: text,
    port,
    user: z.string().optional(),
    password: z.string().optional(),
    ssh: z
      .object({ host: text, user: text, port, password: z.string().optional(), hostKeyFingerprint: text })
      .strict()
      .optional(),
  })
  .strict();

export type SSHOptions = NonNullable<z.input<typeof database>['ssh']>;
