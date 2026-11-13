import { sqlQualifiedName } from '../../util/sql';
import { getDuckDBSchema } from '../util/schema';

import { columnTypes } from './tencent-smartsheet/convert';
import { readTencentSmartsheet } from './tencent-smartsheet/read';

import type { LoadedSource, TencentSmartsheetSourceOptions } from '../../types';

export async function loadTencentSmartsheet(options: TencentSmartsheetSourceOptions): Promise<LoadedSource> {
  const { fields, rows } = await readTencentSmartsheet(options);
  const structure = JSON.stringify([columnTypes(fields)]);
  let rowsJson: string | undefined = JSON.stringify(rows);
  return {
    register: async (conn, namespace) => {
      if (rowsJson === undefined) throw new Error('Tencent Docs SmartSheet source is already registered.');
      // Bind both the data and its explicit schema: no temporary files or SQL interpolation.
      // A typed JSON list also preserves column types when there are no records.
      await conn.run(
        `CREATE TABLE ${sqlQualifiedName(
          'data',
          namespace
        )} AS SELECT item.* FROM (SELECT unnest(from_json_strict($1::JSON, $2)) AS item)`,
        [rowsJson, structure]
      );
      rowsJson = undefined;
      return ['data'];
    },
    getSchema: (conn, namespace) => getDuckDBSchema(conn, ['data'], namespace),
    allowedPaths: [],
    cleanup: async () => {},
  };
}
