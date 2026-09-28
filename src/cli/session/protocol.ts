import { tmpdir } from 'os';
import { join } from 'path';

import { z } from 'zod';

import type { DataSourceConfig } from '../../types';

export const IPC_TIMEOUT_MS = 120_000;
export const IPC_MAX_REQUEST_BYTES = 1024 * 1024;
export const IPC_MAX_RESPONSE_BYTES = 16 * 1024 * 1024;

const text = z.string().min(1);
const port = z.number().int().min(1).max(65535).optional();
const file = z.object({ path: text, headers: z.record(z.string()).optional() }).strict();
const database = z
  .object({
    host: text,
    database: text,
    port,
    user: z.string().optional(),
    password: z.string().optional(),
    ssh: z.object({ host: text, user: text, port, password: z.string().optional() }).strict().optional(),
  })
  .strict();

const sourceSchema = z.discriminatedUnion('type', [
  z
    .object({ type: z.literal('csv-file'), options: file.extend({ options: z.record(z.unknown()).optional() }) })
    .strict(),
  z.object({ type: z.literal('json-file'), options: file }).strict(),
  z.object({ type: z.literal('parquet'), options: file }).strict(),
  z.object({ type: z.literal('excel'), options: file }).strict(),
  z.object({ type: z.literal('sqlite'), options: z.object({ path: text }).strict() }).strict(),
  z
    .object({
      type: z.literal('csv'),
      options: z.object({ csv: text, options: z.record(z.unknown()).optional() }).strict(),
    })
    .strict(),
  z.object({ type: z.literal('json'), options: z.object({ data: z.array(z.record(z.unknown())) }).strict() }).strict(),
  z.object({ type: z.literal('text'), options: z.object({ text }).strict() }).strict(),
  z.object({ type: z.literal('mysql'), options: database }).strict(),
  z.object({ type: z.literal('mongodb'), options: z.object({ connection: text, database: text }).strict() }).strict(),
  z.object({ type: z.literal('postgresql'), options: database.extend({ schema: text.optional() }) }).strict(),
  z
    .object({ type: z.literal('supabase'), options: z.object({ accessToken: text, projectRef: text }).strict() })
    .strict(),
]);

export const sourceConfig = sourceSchema.transform((value) => value as DataSourceConfig);
export const modelSchema = z.object({ model: text, apiKey: text.optional(), baseURL: text.optional() }).strict();

const execution = {
  maxRows: z.number().int().positive().max(10000).optional(),
  maxResultBytes: z.number().int().positive().optional(),
};

export const requestSchema = z.discriminatedUnion('command', [
  z.object({ command: z.literal('schema') }).strict(),
  z.object({ command: z.literal('profile'), metrics: z.array(text).optional() }).strict(),
  z.object({ command: z.literal('suggest'), count: z.number().int().positive().max(100) }).strict(),
  z
    .object({
      command: z.literal('analyze'),
      query: text,
      strategy: z.enum(['direct', 'loop', 'subset']).optional(),
      ...execution,
    })
    .strict(),
  z.object({ command: z.literal('translate'), query: text }).strict(),
  z.object({ command: z.literal('query'), dsl: text, ...execution }).strict(),
  z.object({ command: z.literal('dispose') }).strict(),
]);

export type Request = z.infer<typeof requestSchema>;

export const startupSchema = z.object({ source: sourceConfig, llm: modelSchema }).strict();

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
