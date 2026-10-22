import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

function readModelEnv(path = resolve(import.meta.dirname, '../../.env')) {
  const env = parseEnv(readFileSync(path, 'utf8'));
  const names = ['OPENAI_MODEL', 'OPENAI_BASE_URL', 'OPENAI_API_KEY'];
  for (const name of names) {
    if (!env[name]?.trim()) throw new Error(`${name} is required in ${path}`);
  }
  const endpoint = new URL(env.OPENAI_BASE_URL);
  if (!['http:', 'https:'].includes(endpoint.protocol)) throw new Error('OPENAI_BASE_URL must use HTTP or HTTPS');
  process.stdout.write(`Model: ${env.OPENAI_MODEL}; endpoint: ${endpoint.origin}${endpoint.pathname}; config: ${path}\n`);
  return Object.fromEntries(names.map((name) => [name, env[name]]));
}

export { readModelEnv };
