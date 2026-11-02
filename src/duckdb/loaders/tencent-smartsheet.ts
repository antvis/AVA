import { sqlIdentifier, sqlQualifiedName } from '../../util/sql';
import { getDuckDBSchema } from '../util/schema';

import { loadJson } from './json';
import { columnTypes } from './tencent/convert';
import { readTencentTable } from './tencent/read';

import type { LoadedSource, TencentDocsSourceOptions } from '../../types';

export async function loadTencentDocs(options: TencentDocsSourceOptions): Promise<LoadedSource> {
  const { fields, rows } = await readTencentTable(options);
  const columns = columnTypes(fields);
  const source = rows.length ? await loadJson({ data: rows, options: { auto_detect: false, columns } }) : undefined;
  return {
    register: async (conn, namespace) => {
      const data = sqlQualifiedName('data', namespace);
      if (!source) {
        const projection = Object.entries(columns).map(([name, type]) => `NULL::${type} AS ${sqlIdentifier(name)}`);
        await conn.run(`CREATE TABLE ${data} AS SELECT ${projection.join(', ')} WHERE FALSE`);
      } else {
        try {
          await source.register(conn, namespace);
          const snapshot = sqlQualifiedName('tencent_snapshot', namespace);
          // Materialize before DuckDB access is locked: no temp-file directory
          // needs to remain whitelisted during subsequent model-generated queries.
          await conn.run(`CREATE TABLE ${snapshot} AS SELECT * FROM ${data}`);
          await conn.run(`DROP VIEW ${data}`);
          await conn.run(`ALTER TABLE ${snapshot} RENAME TO data`);
        } finally {
          await source.cleanup();
        }
      }
      return ['data'];
    },
    getSchema: (conn, namespace) => getDuckDBSchema(conn, ['data'], namespace),
    allowedPaths: [],
    cleanup: async () => {
      await source?.cleanup();
    },
  };
}
