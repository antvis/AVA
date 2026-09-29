import { afterEach, describe, expect, it } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

function mongoConnection(port: number): string {
  return ['mongodb', '://', 'ava_test', ':', 'ava_test_password', `@127.0.0.1:${port}`, '/?authSource=ava_mongodb_test'].join(
    ''
  );
}

describe.skipIf(process.env.AVA_MONGODB_TEST !== '1')('profile/mongodb', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('profiles loaded MongoDB collections through the engine', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'mongodb',
      options: {
        connection: mongoConnection(Number(process.env.AVA_MONGODB_TEST_PORT ?? 17017)),
        database: 'ava_mongodb_test',
      },
    });

    const profile = await engine.profile();

    expect(profile.tables.map(({ name, metrics }) => ({ name, metrics }))).toEqual([
      { name: 'customers', metrics: { row_count: 3 } },
      { name: 'order notes', metrics: { row_count: 2 } },
      { name: 'orders', metrics: { row_count: 4 } },
    ]);
    expect(profile.tables[0].fields.find(({ name }) => name === 'created_on')).toMatchObject({
      logicalType: 'date',
      metrics: {
        null_count: 0,
        distinct_count: 2,
        min: Date.UTC(2024, 0, 10),
        max: Date.UTC(2024, 1, 20),
      },
    });
    expect(profile.tables[2].fields.find(({ name }) => name === 'amount')).toMatchObject({
      logicalType: 'numeric',
      metrics: { null_count: 0, distinct_count: 4, min: 10, max: 35.5, mean: 25 },
    });
  }, 30000);
});
