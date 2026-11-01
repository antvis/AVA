/**
 * Runs against a real Snowflake account prepared with __tests__/datasets/snowflake (setup.sql, then
 * init.sql). Skipped unless AVA_SNOWFLAKE_TEST=1; connection settings come from AVA_SNOWFLAKE_*.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { SnowflakeEngine, SnowflakeQueryTimeoutError } from '../../../src/remote/snowflake';
import { getLLMConfig } from '../../test-utils';

import { snowflakeOptions } from './options';

import type { SnowflakeSourceOptions } from '../../../src/types';

describe.skipIf(process.env.AVA_SNOWFLAKE_TEST !== '1')('snowflake/engine', () => {
  const engines: SnowflakeEngine[] = [];

  afterEach(async () => {
    await Promise.all(engines.splice(0).map((engine) => engine.dispose()));
  });

  async function load(overrides: Partial<SnowflakeSourceOptions> = {}) {
    const engine = new SnowflakeEngine(getLLMConfig());
    engines.push(engine);
    await engine.load({ type: 'snowflake', options: snowflakeOptions(overrides) });
    return engine;
  }

  it('discovers only the authorized schema, with Snowflake types, keys and case-sensitive names', async () => {
    const engine = await load();
    const schema = await engine.schema();

    expect(schema.models.map(({ name }) => name).sort()).toEqual(
      ['CUSTOMERS', 'CUSTOMER_REVENUE', 'ORDERS', 'order notes'].sort()
    );
    const customers = schema.models.find(({ name }) => name === 'CUSTOMERS')!;
    expect(customers.tableReference).toEqual({ catalog: 'AVA_TEST', schema: 'SALES', table: 'CUSTOMERS' });
    expect(customers.primaryKey).toBe('ID');
    expect(customers.columns).toEqual([
      { name: 'ID', type: 'NUMBER(38,0)', notNull: true },
      { name: 'NAME', type: 'VARCHAR(100)', notNull: true },
      { name: 'Region Name', type: 'VARCHAR(20)', notNull: false },
      { name: '城市', type: 'VARCHAR(20)', notNull: false },
      { name: 'CREATED_ON', type: 'DATE', notNull: false },
      { name: 'VIP', type: 'BOOLEAN', notNull: false },
      { name: 'LOCATION', type: 'GEOGRAPHY', notNull: false },
    ]);
    const orders = schema.models.find(({ name }) => name === 'ORDERS')!;
    expect(orders).toMatchObject({ primaryKey: 'ID', uniqueKeys: ['CODE'] });
    expect(orders.columns).toEqual(
      expect.arrayContaining([
        { name: 'AMOUNT', type: 'NUMBER(12,2)', notNull: false },
        { name: 'PLACED_AT', type: 'TIMESTAMP_NTZ(9)', notNull: false },
        { name: 'PICKUP', type: 'TIME(9)', notNull: false },
        { name: 'PAYLOAD', type: 'VARIANT', notNull: false },
        { name: 'RAW', type: 'BINARY', notNull: false },
      ])
    );
    expect(schema.relationships).toEqual([
      {
        name: 'FK_ORDERS_CUSTOMER',
        models: ['ORDERS', 'CUSTOMERS'],
        joinType: 'MANY_TO_ONE',
        condition: '"ORDERS"."CUSTOMER_ID" = "CUSTOMERS"."ID"',
      },
    ]);
  }, 60000);

  it('keeps the ORDER BY of the statement when the result is truncated', async () => {
    const engine = await load();
    const result = await engine.execute(
      'SELECT SEQ8() AS "n" FROM TABLE(GENERATOR(ROWCOUNT => 200000)) ORDER BY "n" DESC',
      { maxRows: 5 }
    );
    const values = result.data.map(({ n }) => Number(n));
    expect(values).toHaveLength(5);
    expect([...values].sort((a, b) => b - a)).toEqual(values);
    expect(result).toMatchObject({ truncated: true, truncatedBy: 'maxRows' });
  }, 60000);

  it('returns JSON-safe values without losing precision', async () => {
    const engine = await load();
    const { data, schema } = await engine.execute(
      `SELECT o.ID, o.BIG_ID, o.AMOUNT, o.RATIO, o.PLACED_AT, o.PLACED_TZ, o.PICKUP, o.PAYLOAD, o.RAW,
         c.CREATED_ON, c.VIP, c."城市", c.ID
       FROM "ORDERS" o JOIN "CUSTOMERS" c ON c.ID = o.CUSTOMER_ID
       WHERE o.ID IN (1001, 1002, 1003) ORDER BY o.ID`
    );
    expect(schema.map(({ name }) => name)).toEqual([
      'ID',
      'BIG_ID',
      'AMOUNT',
      'RATIO',
      'PLACED_AT',
      'PLACED_TZ',
      'PICKUP',
      'PAYLOAD',
      'RAW',
      'CREATED_ON',
      'VIP',
      '城市',
      'ID_2',
    ]);
    expect(data[0]).toEqual({
      ID: 1001,
      BIG_ID: '12345678901234567890',
      AMOUNT: 19.9,
      RATIO: 0.5,
      PLACED_AT: '2024-03-01 09:00:00.123456789',
      PLACED_TZ: '2024-03-01 09:00:00.000000000 +08:00',
      PICKUP: '09:30:00.000000000',
      PAYLOAD: { channel: 'web', items: [1, 2] },
      RAW: 'CAFE',
      CREATED_ON: '2024-01-10',
      VIP: true,
      城市: '杭州',
      ID_2: 1,
    });
    // 2^53 + 1 cannot be a JavaScript number; NaN cannot be JSON.
    expect(data[1]).toMatchObject({ BIG_ID: '9007199254740993', AMOUNT: 35.5 });
    expect(data[2]).toMatchObject({ RATIO: 'NaN', PAYLOAD: [], RAW: null });
  }, 60000);

  it.each([
    'CREATE TABLE "AVA_PROBE" (ID INT)',
    'DROP TABLE "ORDERS"',
    'INSERT INTO "ORDERS" (ID, CUSTOMER_ID) VALUES (1, 1)',
    'UPDATE "ORDERS" SET AMOUNT = 0',
    'DELETE FROM "ORDERS"',
    'MERGE INTO "ORDERS" t USING (SELECT 1 AS ID) s ON t.ID = s.ID WHEN MATCHED THEN DELETE',
    'TRUNCATE TABLE "ORDERS"',
    'GRANT SELECT ON TABLE "ORDERS" TO ROLE PUBLIC',
    'CALL SYSTEM$WAIT(1)',
    // Snowflake compiles and runs anonymous procedures even inside a subquery.
    "WITH p AS PROCEDURE () RETURNS VARCHAR LANGUAGE SQL AS $$ BEGIN RETURN 'x'; END $$ CALL p()",
    "with p as /* x */ procedure () returns varchar language sql as $$ begin return 'x'; end $$ call p()",
    'WITH "q" AS (SELECT 1 AS "A"), p AS PROCEDURE () RETURNS VARCHAR LANGUAGE SQL AS $$ BEGIN RETURN 1; END $$ CALL p()',
    "EXECUTE IMMEDIATE 'SELECT 1'",
    "BEGIN RETURN 'x'; END",
    'SELECT 1; DROP TABLE "ORDERS"',
    'SELECT 1; SELECT 2',
    'USE ROLE ACCOUNTADMIN',
    "ALTER SESSION SET QUERY_TAG = 'x'",
    'SET x = 1',
    'SHOW TABLES',
    'EXPLAIN SELECT 1',
    'COPY INTO @~/ava FROM "ORDERS"',
    'SELECT SYSTEM$CANCEL_ALL_QUERIES(1)',
  ])(
    'refuses non-query statement: %s',
    async (sql) => {
      const engine = await load();
      await expect(engine.execute(sql)).rejects.toThrow();
      await expect(engine.execute('SELECT COUNT(*) AS "count" FROM "ORDERS"')).resolves.toMatchObject({
        data: [{ count: 4 }],
      });
    },
    60000
  );

  it('profiles tables, including semi-structured and spatial columns', async () => {
    const engine = await load();
    const schema = await engine.schema();
    const profile = await engine.profile(schema);
    const metrics = (table: string, column: string) =>
      profile.models.find(({ name }) => name === table)!.columns.find(({ name }) => name === column)!.metrics;

    expect(profile.models.find(({ name }) => name === 'ORDERS')!.metrics).toEqual({ row_count: 4 });
    expect(metrics('ORDERS', 'AMOUNT')).toEqual({ null_count: 0, distinct_count: 4, min: 10, max: 35.5, mean: 25.1 });
    expect(metrics('CUSTOMERS', 'CREATED_ON')).toMatchObject({
      distinct_count: 2,
      min: Date.UTC(2024, 0, 10),
      max: Date.UTC(2024, 1, 20),
    });

    const duplicates = await engine.profile(schema, {
      metrics: ['duplicate_count', { id: 'top_values', maxDistinctRatio: 1 }],
    });
    const columns = duplicates.models.find(({ name }) => name === 'CUSTOMERS')!.columns;
    expect(columns.find(({ name }) => name === 'LOCATION')!.metrics).toEqual({ duplicate_count: 0 });
    expect(columns.find(({ name }) => name === 'Region Name')!.metrics).toEqual({
      duplicate_count: 1,
      top_values: [
        { value: 'East', count: 2 },
        { value: 'West', count: 1 },
      ],
    });
  }, 120000);

  /**
   * Final status of statements whose text contains `marker`, once Snowflake no longer reports them
   * running. The marker is a literal because AVA drops trailing comments before running a statement.
   */
  async function finalStatus(engine: SnowflakeEngine, marker: string) {
    for (let attempt = 0; ; attempt += 1) {
      const { data } = await engine.execute(
        `SELECT EXECUTION_STATUS AS "status", ERROR_CODE AS "code"
         FROM TABLE(INFORMATION_SCHEMA.QUERY_HISTORY_BY_USER(RESULT_LIMIT => 1000))
         WHERE QUERY_TEXT LIKE '%${marker}%' AND QUERY_TEXT NOT LIKE '%QUERY_HISTORY%' AND QUERY_TEXT NOT LIKE 'SELECT * FROM (%'`
      );
      if ((data.length && data.every(({ status }) => status !== 'RUNNING')) || attempt === 30) return data;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  it('cancels a statement in Snowflake when it outlives queryTimeoutMs', async () => {
    const marker = `ava-timeout-${Date.now()}`;
    const engine = await load({ queryTimeoutMs: 3000 });
    const started = Date.now();
    const error = await engine
      .execute(`SELECT COUNT(*) AS "c", '${marker}' AS "marker" FROM TABLE(GENERATOR(TIMELIMIT => 60))`)
      .catch((e) => e);
    expect(Date.now() - started).toBeLessThan(15000);
    // The client deadline normally fires first; Snowflake's own statement timeout is the backstop.
    expect(error instanceof SnowflakeQueryTimeoutError || /timeout/i.test(error.message)).toBe(true);
    const [status] = await finalStatus(await load(), marker);
    // 604: cancelled by the client; 630: stopped by Snowflake's statement timeout.
    expect(status.status).toBe('FAILED_WITH_ERROR');
    expect([604, 630]).toContain(status.code);
  }, 90000);

  it('cancels running statements when the source is disposed', async () => {
    const marker = `ava-dispose-${Date.now()}`;
    const engine = await load({ queryTimeoutMs: 120000 });
    const running = engine.execute(
      `SELECT COUNT(*) AS "c", '${marker}' AS "marker" FROM TABLE(GENERATOR(TIMELIMIT => 90))`
    );
    const outcome = running.then(
      () => 'completed',
      (error: Error) => error.message
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await engine.dispose();
    expect(await outcome).not.toBe('completed');
    const [status] = await finalStatus(await load(), marker);
    expect(status).toEqual({ status: 'FAILED_WITH_ERROR', code: 604 });
  }, 120000);

  it('reports configuration problems at load time', async () => {
    await expect(load({ schema: 'NO_SUCH_SCHEMA' })).rejects.toThrow('does not exist or is not authorized');
    await expect(load({ schema: 'PRIVATE' })).rejects.toThrow('is not authorized for role');
    await expect(load({ warehouse: 'NO_SUCH_WAREHOUSE' })).rejects.toThrow('No usable Snowflake warehouse');
  }, 60000);
});
