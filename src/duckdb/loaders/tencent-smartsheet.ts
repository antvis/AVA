import { getDuckDBSchema } from '../util/schema';

import { columnTypes } from './tencent/convert';
import { readTencentTable } from './tencent/read';

import type { LoadedSource, TencentDocsSourceOptions } from '../../types';

export async function loadTencentDocs(options: TencentDocsSourceOptions): Promise<LoadedSource> {
  const { fields, rows } = await readTencentTable(options);
  const structure = JSON.stringify([columnTypes(fields)]);
  return {
    register: async (conn) => {
      // Bind both the data and its explicit schema: no temporary files or SQL interpolation.
      // A typed JSON list also preserves column types when there are no records.
      await conn.run(
        'CREATE TABLE data AS SELECT item.* FROM (SELECT unnest(from_json_strict($1::JSON, $2)) AS item)',
        [JSON.stringify(rows), structure]
      );
      return ['data'];
    },
    getSchema: (conn) => getDuckDBSchema(conn, ['data']),
    allowedPaths: [],
    cleanup: async () => {},
  };
}
