import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { readJson, sha256 } from './files.js';

function validateResume(previous, current, compatibleImplementations = []) {
  if (!previous || !current || !previous.implementation || !current.implementation)
    throw new Error('Invalid run manifest.');
  const ignored = new Set(['ids', 'createdAt', 'concurrency', 'resources', 'implementation', 'resumes']);
  for (const key of new Set([...Object.keys(previous), ...Object.keys(current)])) {
    if (!ignored.has(key) && !isDeepStrictEqual(previous[key], current[key]))
      throw new Error(`Run configuration changed: ${key}. Choose a new --output directory.`);
  }
  if (!Array.isArray(previous.ids) || !previous.ids.every((id) => current.ids.includes(id)))
    throw new Error('Resume selection must include all previous question IDs. Use --limit all.');
  for (const [file, hash] of Object.entries(previous.resources ?? {})) {
    if (current.resources?.[file] !== hash) throw new Error(`Dataset resource changed: ${file}`);
  }
  if (!previous.implementation || (current.resources && !previous.resources)) throw new Error('Invalid run manifest.');
  const compatible = compatibleImplementations.find((files) =>
    Object.entries(files).every(([file, hash]) => previous.implementation[file] === hash)
  );
  for (const file of new Set([...Object.keys(previous.implementation), ...Object.keys(current.implementation)])) {
    if (previous.implementation[file] === current.implementation[file]) continue;
    if (compatible && Object.hasOwn(compatible, file)) continue;
    throw new Error(`Run implementation changed: ${file}. Choose a new --output directory.`);
  }
}

function pendingSamples(samples, output, { idKey, databaseKey, resultExtension }) {
  return samples.filter((sample) => {
    const id = String(sample[idKey]);
    const path = join(output, 'records', `${id}.json`);
    if (!existsSync(path)) return true;
    const record = readJson(path);
    if (record[idKey] !== sample[idKey] || record[databaseKey] !== sample[databaseKey])
      throw new Error(`Record identity changed: ${id}`);
    if (record.status !== 'success') return true;
    for (const [folder, extension, hash] of [
      ['sql', 'sql', record.sql_sha256],
      ['exec_result', resultExtension, record.result_sha256],
    ]) {
      const file = join(output, folder, `${id}.${extension}`);
      if (!existsSync(file) || sha256(file) !== hash) throw new Error(`Saved result changed: ${file}`);
    }
    return false;
  });
}

export { validateResume, pendingSamples };
