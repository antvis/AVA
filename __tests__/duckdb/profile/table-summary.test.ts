import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';

import { profileTables } from '../../../src/duckdb/profile';
import { getDuckDBSchema } from '../../../src/duckdb/util/schema';
import { profileOutputSchema } from '../../../src/contracts';

import type { DuckDBConnection } from '@duckdb/node-api';

describe('profile/table summary', () => {
  let db: DuckDBInstance;
  let connection: DuckDBConnection;

  beforeEach(async () => {
    db = await DuckDBInstance.create(':memory:');
    connection = await db.connect();
    await connection.run('CREATE TABLE samples(center0 VARCHAR, amount DOUBLE, day DATE, tags INTEGER[])');
  });
  afterEach(() => {
    connection.closeSync();
    db.closeSync();
  });

  it.each([false, true])('distinguishes missing cells, affected columns and NaN (populated: %s)', async (populated) => {
    if (populated) {
      await connection.run("INSERT INTO samples VALUES ('A', 'NaN', NULL, NULL), (NULL, 1, NULL, [1])");
    }
    const profile = await profileTables(connection, await getDuckDBSchema(connection), {
      metrics: [{ id: 'table_summary' }, { id: 'null_count' }, { id: 'skewness' }],
    });
    const result = profileOutputSchema.parse(profile).models[0];
    expect(result.metrics.table_summary).toEqual({
      row_count: populated ? 2 : 0,
      column_count: 4,
      null_cell_count: populated ? 4 : 0,
      null_cell_ratio: populated ? 0.5 : 0,
      columns_with_nulls: populated ? 3 : 0,
      all_null_columns: populated ? 1 : 0,
      type_counts: { numeric: 1, string: 1, boolean: 0, date: 1, unknown: 1 },
    });
    expect(result.columns.map(({ metrics }) => metrics.null_count)).toEqual(populated ? [1, 0, 2, 1] : [0, 0, 0, 0]);
  });

  it('shares the aggregate scan on a wide table', async () => {
    await connection.run(
      `CREATE TABLE wide AS SELECT ${Array.from(
        { length: 120 },
        (_, i) => `CASE WHEN x % 2 = 0 THEN NULL ELSE ${i} END AS c${i}`
      ).join(', ')} FROM range(1000) t(x)`
    );
    const schema = await getDuckDBSchema(connection);
    schema.models = schema.models.filter(({ name }) => name === 'wide');
    const query = vi.spyOn(connection, 'runAndReadAll');
    const profile = await profileTables(connection, schema, {
      metrics: [{ id: 'table_summary' }, { id: 'null_count' }],
    });
    expect(query).toHaveBeenCalledTimes(1);
    const sql = query.mock.calls[0][0];
    query.mockRestore();
    expect(profile.models[0].metrics.table_summary).toMatchObject({ null_cell_count: 60000, null_cell_ratio: 0.5 });
    const plan = String((await connection.runAndReadAll(`EXPLAIN ${sql}`)).getRowObjectsJson()[0].explain_value);
    expect(plan.match(/SEQ_SCAN/g)).toHaveLength(1);
  });
});
