/** Uses __tests__/datasets/sales.sqlite, generated from sales.csv. */
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { AVA } from '../../../src';
import { getLLMConfig } from '../../test-utils';

describe('loaders/sqlite', () => {
  let ava: AVA;

  afterEach(async () => {
    await ava?.dispose();
  });

  it('loads a SQLite file with a complete schema and queryable data', async () => {
    ava = new AVA({ llm: getLLMConfig() });
    const schema = await ava.load({
      type: 'sqlite',
      options: { path: join(__dirname, '../../datasets/sales.sqlite') },
    });

    expect(schema).toEqual({
      tables: [
        {
          name: 'sales',
          columnCount: 12,
          fields: [
            { name: 'order_id', type: 'VARCHAR', nullable: true },
            { name: 'order_date', type: 'VARCHAR', nullable: true },
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

    const result = await ava.engine!.execute('SELECT * FROM sales ORDER BY order_id', { maxRows: 240 });
    expect(result.data).toHaveLength(240);
    expect(result.data[0]).toEqual({
      order_id: 'ORD-0001',
      order_date: '2025-01-01',
      region: null,
      category: 'Electronics',
      product: 'Monitor',
      channel: 'Retail',
      quantity: null,
      unit_price: 249,
      discount: 0.1,
      sales: 224.1,
      cost: 165,
      profit: 59.1,
    });
    expect(result.data[239]).toMatchObject({ order_id: 'ORD-0240', order_date: '2025-12-31' });
  });
});
