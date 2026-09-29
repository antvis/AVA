import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, lstatSync } from 'node:fs';
import { join } from 'node:path';

export function hashTree(root) {
  const hash = createHash('sha256');
  function visit(directory, prefix = '') {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const relative = `${prefix}${name}`;
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw new Error(`Unexpected symlink in snapshot: ${path}`);
      if (stat.isDirectory()) visit(path, `${relative}/`);
      else hash.update(relative).update('\0').update(readFileSync(path)).update('\0');
    }
  }
  visit(root);
  return hash.digest('hex');
}
