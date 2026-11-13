import { sqlQualifiedName } from '../../util/sql';
import { getDuckDBSchema } from '../util/schema';

import { columnTypes } from './tencent-smartsheet/convert';
import { readTencentSmartsheet } from './tencent-smartsheet/read';

import type { LoadedSource, TencentSmartsheetSourceOptions } from '../../types';

export async function loadTencentSmartsheet(options: TencentSmartsheetSourceOptions): Promise<LoadedSource> {
  const { fields, rows } = await readTencentSmartsheet(options);
  const structure = JSON.stringify([columnTypes(fields)]);
  return {
    register: async (conn, namespace) => {
      // Bind both the data and its explicit schema: no temporary files or SQL interpolation.
      // A typed JSON list also preserves column types when there are no records.
      await conn.run(
        `CREATE TABLE ${sqlQualifiedName(
          'data',
          namespace
        )} AS SELECT item.* FROM (SELECT unnest(from_json_strict($1::JSON, $2)) AS item)`,
        [JSON.stringify(rows), structure]
      );
      return ['data'];
    },
    getSchema: (conn, namespace) => getDuckDBSchema(conn, ['data'], namespace),
    allowedPaths: [],
    cleanup: async () => {},
  };
}
