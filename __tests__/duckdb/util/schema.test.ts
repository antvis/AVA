import * as path from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { getDuckDBSchema } from '../../../src/duckdb/util/schema';
import { stringifySchema } from '../../../src/util/schema';
import { sqlStringLiteral } from '../../../src/util/sql';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('duckdb/util/schema', () => {
  let db: DuckDBInstance;
  let conn: DuckDBConnection;

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    conn = await db.connect();
  });

  afterEach(() => {
    conn.closeSync();
    db.closeSync();
  });

  it('reads the sales CSV schema with native types and original column order', async () => {
    const csvPath = path.join(__dirname, '../../datasets/sales.csv');
    await conn.run(`CREATE TABLE sales AS SELECT * FROM read_csv_auto(${sqlStringLiteral(csvPath)})`);

    const schema = await getDuckDBSchema(conn, ['sales']);

    expect(schema).toEqual({
      tables: [
        {
          name: 'sales',
          columnCount: 12,
          fields: [
            { name: 'order_id', type: 'VARCHAR', nullable: true },
            { name: 'order_date', type: 'DATE', nullable: true },
            { name: 'region', type: 'VARCHAR', nullable: true },
            { name: 'category', type: 'VARCHAR', nullable: true },
            { name: 'product', type: 'VARCHAR', nullable: true },
            { name: 'channel', type: 'VARCHAR', nullable: true },
            { name: 'quantity', type: 'BIGINT', nullable: true },
            { name: 'unit_price', type: 'DOUBLE', nullable: true },
            { name: 'discount', type: 'DOUBLE', nullable: true },
            { name: 'sales', type: 'DOUBLE', nullable: true },
            { name: 'cost', type: 'DOUBLE', nullable: true },
            { name: 'profit', type: 'DOUBLE', nullable: true },
          ],
          indexes: [],
        },
      ],
      relations: [],
    });
  });

  it('stringifies the sales CSV schema as a structural description', async () => {
    const csvPath = path.join(__dirname, '../../datasets/sales.csv');
    await conn.run(`CREATE TABLE sales AS SELECT * FROM read_csv_auto(${sqlStringLiteral(csvPath)})`);

    const schema = await getDuckDBSchema(conn, ['sales']);

    expect(stringifySchema(schema)).toBe(`Dataset Info: 1 table(s)
Table "sales":
- Columns: 12
Fields:
- "order_id" (VARCHAR)
- "order_date" (DATE)
- "region" (VARCHAR)
- "category" (VARCHAR)
- "product" (VARCHAR)
- "channel" (VARCHAR)
- "quantity" (BIGINT)
- "unit_price" (DOUBLE)
- "discount" (DOUBLE)
- "sales" (DOUBLE)
- "cost" (DOUBLE)
- "profit" (DOUBLE)

`);
  });
});
