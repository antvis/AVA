import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from '../_shared/files.js';
import type { AVA } from '../../lib/index.js';

export function implementationHashes() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  function files(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? files(path) : path.endsWith('.js') ? [path] : [];
    });
  }
  return Object.fromEntries([
    ...files(join(root, 'lib')),
    ...['workflow.ts', 'runtime.ts', 'strategies.ts', 'semantic.ts', 'model.ts'].map((file) => join(root, 'evals/ava-workflow', file)),
    ...['model-env.js', 'usage.js'].map((file) => join(root, 'evals/_shared', file)),
  ].sort().map((file) => [relative(root, file), sha256(file)]));
}

/** Keep tool actions and query diagnostics, without model reasoning or result rows. */
export function traceWorkflow(ava: AVA) {
  const traces: unknown[] = [];
  for (const name of ['reasonend', 'querystart', 'queryend']) {
    ava.on(name, (event: { data?: { step?: number; action?: string; dsl?: string; error?: unknown; truncated?: boolean } }) => {
      const { step, action, dsl, error, truncated } = event.data ?? {};
      traces.push({ event: name, step, action, dsl, error, truncated });
    });
  }
  return traces;
}
