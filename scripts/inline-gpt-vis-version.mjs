import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('@antv/gpt-vis/package.json');
const output = new URL('../lib/visualization/generator.js', import.meta.url);
const code = await readFile(output, 'utf8');
const metadataImport = 'require("@antv/gpt-vis/package.json")';

// Match Vite's metadata inlining so production consumers do not need GPT-Vis installed.
assert(code.includes(metadataImport), 'Expected GPT-Vis metadata import in CJS output');
await writeFile(output, code.replace(metadataImport, JSON.stringify({ version })));
