import { createRequire } from 'node:module';
import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const source = dirname(require.resolve('sql.js'));
const target = new URL('../public/vendor/sqlite/', import.meta.url);
await mkdir(target, { recursive: true });
for (const file of ['sql-wasm-browser.js', 'sql-wasm-browser.wasm'])
  await copyFile(join(source, file), new URL(file, target));
