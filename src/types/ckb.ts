import { ZodTypeAny } from 'zod';

export type CKB = Record<
  string,
  {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    zodSchema: Record<string, ZodTypeAny>;
  }
>;
