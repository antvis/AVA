const { createHash } = require('node:crypto');
const { mkdirSync, readFileSync, renameSync, writeFileSync } = require('node:fs');
const { dirname } = require('node:path');

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

function atomicJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(value, null, 2) + '\n');
  renameSync(temp, path);
}

module.exports = { sha256, readJson, atomicJson };
