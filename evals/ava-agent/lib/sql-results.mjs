import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export function validateResult(value) {
  if (!value || value.truncated || !Array.isArray(value.schema) || !value.schema.length ||
      !Array.isArray(value.rows) || value.rows.length > 10000 ||
      value.schema.some((column) => !column || typeof column.name !== 'string' || typeof column.type !== 'string') ||
      value.rows.some((row) => !Array.isArray(row) || row.length !== value.schema.length ||
        row.some((cell) => cell !== null && typeof cell !== 'string' && typeof cell !== 'boolean' &&
          !(typeof cell === 'number' && Number.isFinite(cell))))) {
    throw new Error('Invalid, truncated, or oversized SQL result.');
  }
  return value;
}

export async function readSessionResult(sessionId) {
  const { stdout } = await exec('docker', ['ps', '-q', '--filter', 'label=eve.sandbox=1',
    '--filter', 'label=eve.sandbox.role=session', '--filter', `label=eve.sandbox.tag.sessionId=${sessionId}`],
  { timeout: 30000 });
  const ids = stdout.trim().split(/\s+/).filter(Boolean);
  if (ids.length !== 1) throw new Error('Expected exactly one evaluation session container.');
  // A fixed file and bounded read avoid model-controlled host paths and silent truncation.
  const result = await exec('docker', ['exec', ids[0], 'cat', '/workspace/output/result.json'],
    { timeout: 30000, maxBuffer: 64 * 1024 * 1024 });
  return validateResult(JSON.parse(result.stdout));
}
