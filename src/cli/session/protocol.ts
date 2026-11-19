import { z } from 'zod';

import {
  sourceInputSchema,
  profileInputSchema,
  profileOutputSchema,
  qualityInputSchema,
  schemaOutputSchema,
  semanticOutputSchema,
} from '../../contracts';

export const IPC_TIMEOUT_MS = 120_000;
export const IPC_MAX_REQUEST_BYTES = 1024 * 1024;
export const IPC_MAX_RESPONSE_BYTES = 16 * 1024 * 1024;

const text = z.string().min(1);

export const modelSchema = z.object({ model: text, apiKey: text.optional(), baseURL: text.optional() }).strict();
export const engineTypeSchema = z.enum([
  'duckdb',
  'python',
  'javascript',
  'supabase',
  'clickhouse',
  'sqlserver',
  'snowflake',
]);

const execution = {
  maxRows: z.number().int().positive().max(10000).optional(),
  maxResultBytes: z.number().int().positive().optional(),
};

export const requestSchema = z.discriminatedUnion('command', [
  z.object({ command: z.literal('schema'), schema: schemaOutputSchema.optional() }).strict(),
  z.object({ command: z.literal('semantic'), semantic: semanticOutputSchema.optional() }).strict(),
  z
    .object({
      command: z.literal('profile'),
      ...profileInputSchema.shape,
      profile: profileOutputSchema.optional(),
    })
    .strict(),
  z.object({ command: z.literal('suggest'), count: z.number().int().positive().max(100) }).strict(),
  z.object({ command: z.literal('quality'), rules: qualityInputSchema.shape.rules }).strict(),
  z
    .object({
      command: z.literal('analyze'),
      query: text,
      strategy: z.enum(['direct', 'loop']).optional(),
      ...execution,
    })
    .strict(),
  z.object({ command: z.literal('translate'), query: text }).strict(),
  z.object({ command: z.literal('query'), dsl: text, ...execution }).strict(),
  z.object({ command: z.literal('dispose') }).strict(),
]);

export type Request = z.infer<typeof requestSchema>;

export const startupSchema = z
  .object({
    sources: z.array(sourceInputSchema).nonempty(),
    llm: modelSchema,
    engine: engineTypeSchema.optional(),
  })
  .strict();

export const responseSchema = z.union([
  z.object({ ok: z.literal(true), result: z.unknown() }).strict(),
  z.object({ ok: z.literal(false), error: z.string() }).strict(),
]);
