import { afterEach, describe, expect, it } from 'vitest';

import { AVA } from '../../../src';
import { getLLMConfig } from '../../test-utils';

describe.skipIf(process.env.AVA_MYSQL_TEST !== '1')('profile/mysql', () => {
  let ava: AVA | null = null;

  afterEach(async () => {
    await ava?.dispose();
    ava = null;
  });

  it('profiles loaded MySQL tables through the public API', async () => {
    ava = new AVA({ llm: getLLMConfig() });
    await ava.load({
      type: 'mysql',
      options: {
        host: '127.0.0.1',
        port: Number(process.env.AVA_MYSQL_TEST_PORT ?? 13306),
        database: 'ava_mysql_test',
        user: 'ava_test',
        password: 'ava_test_password',
      },
    });

    const profile = await ava.profile();

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
