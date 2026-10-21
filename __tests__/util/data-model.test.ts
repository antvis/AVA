import { describe, expect, it } from 'vitest';

import { dataModelMetadataSchema } from '../../src/util/data-model';

import type { DataModel } from '../../src/data-model.types';

describe('dataModelMetadataSchema', () => {
  it('preserves and snapshots structure, observations and semantic metadata together', () => {
    const input: DataModel = {
      properties: { description: 'Orders', custom: { labels: ['sales'] } },
      models: [
        {
          name: 'orders',
          tableReference: { table: 'raw_orders', schema: 'public' },
          primaryKey: ['id'],
          uniqueKeys: [['external_id']],
          metrics: { row_count: 0 },
          properties: { description: 'Confirmed orders' },
          columns: [
            { name: 'id', type: 'INTEGER', notNull: true },
            { name: 'external_id', type: 'VARCHAR', metrics: { top_values: [] } },
            {
              name: 'amount',
              type: 'DOUBLE',
              isCalculated: true,
              expression: 'price * quantity',
              properties: { unit: 'USD' },
              metrics: { min: null, max: 0, custom: [{ value: false, count: 1 }] },
            },
          ],
        },
      ],
      relationships: [
        {
          name: 'parent_order',
          models: ['orders', 'orders'],
          joinType: 'MANY_TO_ONE',
          condition: 'child.parent_id = parent.id',
          properties: { description: 'Parent order' },
          aliases: ['child', 'parent'],
        },
      ],
      views: [{ name: 'large_orders', statement: 'SELECT * FROM orders WHERE amount > 100', custom: true }],
    };
    const result = dataModelMetadataSchema.parse(input);
    expect(result).toEqual(input);
    expect(result.models[0].columns[2].metrics.custom).not.toBe(input.models[0].columns[2].metrics.custom);
    expect(result.properties.custom).not.toBe(input.properties.custom);
  });

  it.each([
    {},
    { tableReference: { table: 'orders' }, refSql: 'SELECT 1' },
    { refSql: 'SELECT 1', baseObject: 'orders' },
    { baseObject: 'orders', tableReference: { table: 'orders' } },
  ])('rejects missing or ambiguous model sources: %j', (source) => {
    expect(() => dataModelMetadataSchema.parse({ models: [{ name: 'orders', ...source }] })).toThrow('exactly one');
  });

  it.each([Infinity, NaN, undefined, BigInt(1), () => 1])(
    'rejects non-JSON observations and properties: %s',
    (value) => {
      expect(() => dataModelMetadataSchema.parse({ properties: { invalid: value } })).toThrow();
      expect(() =>
        dataModelMetadataSchema.parse({ models: [{ name: 'data', baseObject: 'source', metrics: { invalid: value } }] })
      ).toThrow();
    }
  );

  it('accepts an incomplete description without inventing sources, columns or statistics', () => {
    expect(dataModelMetadataSchema.parse({})).toEqual({});
    const input = { models: [{ name: 'data', refSql: 'SELECT 1' }] };
    expect(dataModelMetadataSchema.parse(input)).toEqual(input);
  });

  it('rejects obsolete root fields instead of silently discarding data', () => {
    expect(() => dataModelMetadataSchema.parse({ models: [], tables: [] })).toThrow();
  });
});
