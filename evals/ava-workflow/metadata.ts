import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicJson, readJson, sha256 } from '../_shared/files.js';
import { schemaMetadataSchema } from '../../lib/util/schema.js';
import { profileMetadataSchema } from '../../lib/util/profile.js';
import { buildDataModel } from '../../lib/util/data-model.js';
import type { AVA, Profile, Schema } from '../../lib/index.js';

export type Metadata = { schema: Schema; profile: Profile };
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const metadataImplementation = digest({ node: process.version, files: [
  fileURLToPath(import.meta.url),
  ...['ava.js', 'duckdb/engine.js', 'duckdb/loaders/sqlite.js', 'duckdb/profile.js',
    'duckdb/util/schema.js', 'util/schema.js', 'util/profile.js', 'util/data-model.js', 'util/coerce.js', 'util/sql.js']
    .map(file => fileURLToPath(new URL(`../../lib/${file}`, import.meta.url))),
  fileURLToPath(new URL('../../node_modules/@duckdb/node-api/package.json', import.meta.url)),
].map(sha256) });

/** One in-flight profile per database; validated disk snapshots survive evaluation runs. */
export function createMetadataCache(directory: string) {
  const pending = new Map<string, Promise<Metadata>>();
  return (ava: AVA, database: string): Promise<Metadata> => {
    if (!pending.has(database)) pending.set(database, (async () => {
      const identity = { database: sha256(database), implementation: metadataImplementation };
      const file = join(directory, `${digest(identity)}.json`);
      if (existsSync(file)) {
        const cached = readJson(file);
        if (digest(cached.identity) !== digest(identity) || digest(cached.metadata) !== cached.sha256)
          throw new Error(`Metadata cache integrity check failed: ${file}`);
        const schema = schemaMetadataSchema.parse(cached.metadata.schema);
        const profile = profileMetadataSchema.parse(cached.metadata.profile);
        buildDataModel({ schema, profile });
        return { schema, profile };
      }
      const schema = await ava.schema();
      const profile = await ava.profile();
      const metadata = { schema, profile };
      atomicJson(file, { identity, sha256: digest(metadata), metadata });
      return metadata;
    })());
    return pending.get(database)!;
  };
}
