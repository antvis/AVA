/**
 * Unit tests for src/duckdb/loaders/json.ts
 */

import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('loaders/json', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads an object array as a typed table', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'json', options: { data: [{ name: 'Alice', age: 30 }] } });

    const rows = await engine.execute('SELECT * FROM "data"');
    expect(rows.data).toEqual([{ name: 'Alice', age: 30 }]);
  });

  it('applies explicit types, projection and date parsing to inline JSON', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'json',
      options: {
        data: [{ id: 42, day: '31/12/2025', omitted: true }],
        options: { auto_detect: false, columns: { id: 'VARCHAR', day: 'DATE' }, dateformat: '%d/%m/%Y' },
      },
    });
    const rows = await engine.execute('SELECT *, typeof(day) AS day_type FROM data');
    expect(rows.data[0]).toMatchObject({ id: '42', day_type: 'DATE' });
    expect(rows.data[0]).not.toHaveProperty('omitted');
  });

  it('rejects non-array input', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await expect(engine.load({ type: 'json', options: { data: {} as any } })).rejects.toThrow('Data must be an array');
  });

  it('applies the memory limit during JSON ingestion', async () => {
    engine = new DuckDBEngine(getLLMConfig(), { memoryLimit: '1B' });
    await expect(engine.load({ type: 'json', options: { data: [{ value: 1 }] } })).rejects.toThrow('Out of Memory');
    await expect(engine.schema()).rejects.toThrow('No data loaded');
  });

  it('reports unsupported native reader types instead of rewriting them', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await expect(
      engine.load({
        type: 'json',
        options: { data: [{ payload: { value: 1 } }], options: { columns: { payload: 'VARIANT' } } },
      })
    ).rejects.toThrow('Cannot read a value of type VARIANT');
  });

  it('reads heterogeneous payloads as JSON and uses native VARIANT casts in queries', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const data = [
      { id: 1, payload: { region: 'East', revenue: 120.5 } },
      { id: 2, payload: { region: 'West', revenue: '80.25', extra: true } },
      { id: 3, payload: null },
      { id: 4, payload: { region: 'East', revenue: 'unknown' } },
    ];
    await engine.load({
      type: 'json',
      options: { data, options: { columns: { id: 'INTEGER', payload: 'JSON' } } },
    });

    expect((await engine.schema()).models[0].columns).toContainEqual({
      name: 'payload',
      type: 'JSON',
      notNull: false,
    });
    expect((await engine.execute('SELECT id, payload::VARIANT AS payload FROM data ORDER BY id')).data).toEqual(data);
    const result = await engine.execute(`
      WITH events AS (SELECT payload::VARIANT AS payload FROM data)
      SELECT variant_extract_string(payload, 'region') AS region,
        SUM(TRY_CAST(payload.revenue AS DOUBLE)) AS revenue
      FROM events WHERE variant_exists(payload, 'region')
      GROUP BY region ORDER BY region
    `);
    expect(result.data).toEqual([
      { region: 'East', revenue: 120.5 },
      { region: 'West', revenue: 80.25 },
    ]);
    const profile = await engine.profile(await engine.schema());
    expect(profile.models[0].metrics.row_count).toBe(4);
    expect(profile.models[0].columns.find(({ name }) => name === 'payload')).toMatchObject({
      properties: { logicalType: 'unknown' },
      metrics: { null_count: 1 },
    });
  });
});
