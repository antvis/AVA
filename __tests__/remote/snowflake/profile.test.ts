import { describe, expect, it, vi } from 'vitest';

import { logicalType, profileTables } from '../../../src/remote/snowflake/profile';
import { columnType } from '../../../src/remote/snowflake/schema';

import type { Schema } from '../../../src/types';

const SCHEMA: Schema = {
  models: [
    {
      name: 'Order Lines',
      tableReference: { catalog: 'ANALYTICS', schema: 'SALES', table: 'Order Lines' },
      columns: [
        { name: 'AMOUNT', type: 'NUMBER(12,2)' },
        { name: 'note"text', type: 'VARCHAR(100)' },
        { name: 'PLACED_AT', type: 'TIMESTAMP_NTZ(9)' },
        { name: 'PAYLOAD', type: 'VARIANT' },
      ],
    },
  ],
};

describe('Snowflake profiling', () => {
  it('profiles one fully qualified table per query with quoted identifiers', async () => {
    // Metrics are numbered table first, then column by column in the requested order.
    const run = vi.fn().mockResolvedValue([
      {
        m0: 4,
        m1: 25,
        m2: '35.5',
        m3: 0,
        m4: [{ value: 'gift wrap', count: 2 }],
        m5: 1,
        m6: '1709283600000',
        m7: 0,
        m8: 2,
      },
    ]);

    const result = await profileTables(run, SCHEMA, {
      metrics: [{ id: 'row_count' }, { id: 'mean' }, { id: 'max' }, { id: 'top_values' }, { id: 'duplicate_count' }],
    });

    expect(run).toHaveBeenCalledOnce();
    const sql = run.mock.calls[0][0] as string;
    expect(sql).toContain('FROM "ANALYTICS"."SALES"."Order Lines"');
    expect(sql).toContain('"note""text"');
    expect(sql).toContain('DATE_PART(EPOCH_MILLISECOND, MAX("PLACED_AT"))');
    expect(sql).toContain('WITHIN GROUP (ORDER BY "count" DESC, "value")');
    expect(sql).toContain('COUNT("PAYLOAD") - COUNT(DISTINCT "PAYLOAD")');
    expect(result).toEqual({
      models: [
        {
          name: 'Order Lines',
          metrics: { row_count: 4 },
          columns: [
            {
              name: 'AMOUNT',
              properties: { logicalType: 'numeric' },
              metrics: { mean: 25, max: 35.5, duplicate_count: 0 },
            },
            {
              name: 'note"text',
              properties: { logicalType: 'string' },
              metrics: { top_values: [{ value: 'gift wrap', count: 2 }], duplicate_count: 1 },
            },
            {
              name: 'PLACED_AT',
              properties: { logicalType: 'date' },
              metrics: { max: 1709283600000, duplicate_count: 0 },
            },
            { name: 'PAYLOAD', properties: { logicalType: 'unknown' }, metrics: { duplicate_count: 2 } },
          ],
        },
      ],
    });
  });

  it('casts DATE bounds to timestamps before taking epoch milliseconds', async () => {
    const run = vi.fn().mockResolvedValue([{ m0: '1704844800000', m1: '1708387200000' }]);
    const schema: Schema = {
      models: [{ name: 'T', tableReference: { table: 'T' }, columns: [{ name: 'CREATED_ON', type: 'DATE' }] }],
    };
    const result = await profileTables(run, schema, { metrics: [{ id: 'min' }, { id: 'max' }] });
    expect(run.mock.calls[0][0]).toContain('DATE_PART(EPOCH_MILLISECOND, MIN("CREATED_ON")::TIMESTAMP_NTZ)');
    expect(result.models[0].columns[0].metrics).toEqual({ min: Date.UTC(2024, 0, 10), max: Date.UTC(2024, 1, 20) });
  });

  it.each([{}, 'null', [{ value: 'A' }], [{ count: 2 }], [{ value: 'A', count: 'x' }]])(
    'rejects malformed top_values results %#',
    async (raw) => {
      const run = vi.fn().mockResolvedValue([{ m0: raw }]);
      const schema: Schema = {
        models: [{ name: 'T', tableReference: { table: 'T' }, columns: [{ name: 'C', type: 'VARCHAR' }] }],
      };
      await expect(profileTables(run, schema, { metrics: [{ id: 'top_values' }] })).rejects.toThrow(
        'Invalid Snowflake top_values'
      );
    }
  );

  it.each([
    ['NUMBER(38,0)', 'numeric'],
    ['FLOAT', 'numeric'],
    ['DECFLOAT', 'numeric'],
    ['VARCHAR(25)', 'string'],
    ['TEXT', 'string'],
    ['BOOLEAN', 'boolean'],
    ['DATE', 'date'],
    ['TIMESTAMP_TZ(9)', 'date'],
    ['TIME(9)', 'unknown'],
    ['VARIANT', 'unknown'],
    ['GEOGRAPHY', 'unknown'],
  ])('maps %s to %s', (type, expected) => {
    expect(logicalType(type)).toBe(expected);
  });

  it.each([
    [{ DATA_TYPE: 'NUMBER', NUMERIC_PRECISION: 12, NUMERIC_SCALE: 2 }, 'NUMBER(12,2)'],
    [{ DATA_TYPE: 'TEXT', CHARACTER_MAXIMUM_LENGTH: 25 }, 'VARCHAR(25)'],
    [{ DATA_TYPE: 'TEXT', CHARACTER_MAXIMUM_LENGTH: 16777216 }, 'VARCHAR'],
    [{ DATA_TYPE: 'BINARY', CHARACTER_MAXIMUM_LENGTH: null }, 'BINARY'],
    [{ DATA_TYPE: 'TIMESTAMP_LTZ', DATETIME_PRECISION: 3 }, 'TIMESTAMP_LTZ(3)'],
    [{ DATA_TYPE: 'GEOGRAPHY' }, 'GEOGRAPHY'],
  ])('writes catalog types as DDL does %#', (row, expected) => {
    expect(columnType(row)).toBe(expected);
  });
});
