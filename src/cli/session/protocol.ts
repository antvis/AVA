import { tmpdir } from 'os';
import { join } from 'path';

import { z } from 'zod';

import { sourceConfigSchema } from '../../contracts/source';
import { profileMetadataSchema } from '../../util/profile';
import { schemaMetadataSchema } from '../../util/schema';
import { semanticMetadataSchema } from '../../util/data-model';

export const IPC_TIMEOUT_MS = 120_000;
export const IPC_MAX_REQUEST_BYTES = 1024 * 1024;
export const IPC_MAX_RESPONSE_BYTES = 16 * 1024 * 1024;

const text = z.string().min(1);

export { sourceConfigSchema as sourceConfig } from '../../contracts/source';

export const modelSchema = z.object({ model: text, apiKey: text.optional(), baseURL: text.optional() }).strict();
export const engineTypeSchema = z.enum(['duckdb', 'python', 'javascript', 'supabase', 'clickhouse', 'sqlserver']);

const execution = {
  maxRows: z.number().int().positive().max(10000).optional(),
  maxResultBytes: z.number().int().positive().optional(),
};

export const requestSchema = z.discriminatedUnion('command', [
  z.object({ command: z.literal('schema'), schema: schemaMetadataSchema.optional() }).strict(),
  z.object({ command: z.literal('semantic'), semantic: semanticMetadataSchema.optional() }).strict(),
  z
    .object({
      command: z.literal('profile'),
      metrics: z.array(text).optional(),
      profile: profileMetadataSchema.optional(),
    })
    .strict(),
  z.object({ command: z.literal('suggest'), count: z.number().int().positive().max(100) }).strict(),
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
    source: sourceConfigSchema,
    llm: modelSchema,
    engine: engineTypeSchema.optional(),
  })
  .strict();

export const responseSchema = z.union([
  z.object({ ok: z.literal(true), result: z.unknown() }).strict(),
  z.object({ ok: z.literal(false), error: z.string() }).strict(),
]);

export function sessionDirectory(id: string): string {
  if (!/^ds_(?:[a-f0-9]{24}|[a-z0-9][a-z0-9-]{0,15}_[a-f0-9]{12})$/.test(id)) throw new Error('Invalid dataset ID.');

  return join(tmpdir(), `ava-${id}`);
}

export function socketPath(id: string): string {
  return join(sessionDirectory(id), 'ipc');
}
