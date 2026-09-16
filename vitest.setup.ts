/**
 * Vitest global setup — loads `.env` from the project root before the test files
 * are evaluated, so suites that read `process.env.OPENAI_LLM_API_KEY` at module
 * scope can pick up the key. Without a key the LLM suites are reported as skipped.
 *
 * Uses Node's built-in `process.loadEnvFile()` (Node >= 20.12) — no extra dependency.
 * Real environment variables take precedence over the file, so CI secrets and
 * `OPENAI_LLM_API_KEY=... npm test` keep working as before.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envFile = resolve(process.cwd(), '.env');

if (existsSync(envFile)) {
  // `loadEnvFile` is only declared by @types/node >= 20; this project pins 18.x.
  const { loadEnvFile } = process as unknown as { loadEnvFile?: (path: string) => void };
  loadEnvFile?.call(process, envFile);
}
