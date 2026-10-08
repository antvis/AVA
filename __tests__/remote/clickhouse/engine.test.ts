import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@clickhouse/client';

import { AVA } from '../../../src';
import { ClickHouseEngine } from '../../../src/remote/clickhouse';
import { profileTables as clickhouseProfile } from '../../../src/remote/clickhouse/profile';
import { getLLMConfig } from '../../test-utils';

import type { Schema } from '../../../src/types';

vi.mock('@clickhouse/client', () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

function result(rows: unknown[]) {
  return {
    json: vi.fn().mockResolvedValue(rows),
    text: vi.fn().mockResolvedValue('SelectWithUnionQuery (children 1)'),
  };
}

const TABLE_ROWS = [
  {
    table_name: 'customers',
    engine: 'MergeTree',
    primary_key: '(tenant_id, customer_id)',
    sorting_key: '(tenant_id, customer_id)',
  },
  { table_name: 'order notes', engine: 'MergeTree', primary_key: '', sorting_key: '' },
];

const COLUMN_ROWS = [
  { table_name: 'customers', name: 'tenant_id', type: 'UInt32', nullable: 0, position: 1 },
  { table_name: 'customers', name: 'customer_id', type: 'UInt32', nullable: 0, position: 2 },
  { table_name: 'customers', name: 'name', type: 'String', nullable: 0, position: 3 },
  { table_name: 'customers', name: 'email', type: 'Nullable(String)', nullable: 1, position: 4 },
  { table_name: 'order notes', name: 'order_id', type: 'Nullable(UInt64)', nullable: 1, position: 1 },
  { table_name: 'order notes', name: 'note"text', type: 'Nullable(String)', nullable: 1, position: 2 },
];

function stubClient(resolver: (query: string) => unknown[]) {
  const client = {
    query: vi.fn(async ({ query }: { query: string }) => result(resolver(query))),
    close: vi.fn(async () => undefined),
  };
  mockedCreateClient.mockReturnValue(client as never);
  return client;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('ClickHouseEngine', () => {
  it('loads schema through the official client and normalizes connection options', async () => {
    const client = stubClient((query) => {
      if (query.includes('FROM system.tables')) return TABLE_ROWS;
      if (query.includes('FROM system.columns')) return COLUMN_ROWS;
      return [];
    });
    const engine = new ClickHouseEngine(getLLMConfig());
    const schema = await engine.load({
      type: 'clickhouse',
      options: { host: 'localhost', port: 8123, database: 'default', user: 'default', password: '' },
    });

    expect(mockedCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://localhost:8123/', username: 'default', database: 'default' })
    );
    expect(schema).toEqual({
      tables: [
        {
          name: 'customers',
          columnCount: 4,
          fields: [
            { name: 'tenant_id', type: 'UInt32', nullable: false },
            { name: 'customer_id', type: 'UInt32', nullable: false },
            { name: 'name', type: 'String', nullable: false },
            { name: 'email', type: 'Nullable(String)', nullable: true },
          ],
          indexes: [{ name: 'primary_key', columns: ['tenant_id', 'customer_id'], unique: false, primary: true }],
        },
        {
          name: 'order notes',
          columnCount: 2,
          fields: [
            { name: 'order_id', type: 'Nullable(UInt64)', nullable: true },
            { name: 'note"text', type: 'Nullable(String)', nullable: true },
          ],
          indexes: [],
        },
      ],
      relations: [],
    });

    await engine.dispose();
    expect(client.close).toHaveBeenCalledTimes(1);
  });

  it('executes bounded read-only queries and integrates through AVA', async () => {
    const client = stubClient((query) => {
      if (query.includes('FROM system.tables')) return TABLE_ROWS;
      if (query.includes('FROM system.columns')) return COLUMN_ROWS;
      if (query.startsWith('EXPLAIN AST')) return [{ explain: 'SelectWithUnionQuery (children 1)' }];
      if (query.includes('formatQuery'))
        return [{ query: 'SELECT * FROM (SELECT customer_id, name FROM customers ORDER BY customer_id)' }];
      if (query.includes('LIMIT 3')) {
        return [
          { customer_id: 101, name: 'Alice' },
          { customer_id: 102, name: 'Bob' },
          { customer_id: 201, name: 'Carol' },
        ];
      }
      return [];
    });

    const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'clickhouse' } });
    try {
      await ava.source({
        type: 'clickhouse',
        options: { url: 'http://localhost:8123', database: 'default', username: 'default', password: '' },
      });
      const result = await ava.query(
        'SELECT customer_id, name FROM customers ORDER BY customer_id; -- trailing comment',
        { maxRows: 2 }
      );
      expect(result.data).toEqual([
        { customer_id: 101, name: 'Alice' },
        { customer_id: 102, name: 'Bob' },
      ]);
      expect(result.truncatedBy).toBe('maxRows');
      expect(client.query).toHaveBeenLastCalledWith(
        expect.objectContaining({
          format: 'JSONEachRow',
          query:
            'SELECT * FROM (\nSELECT * FROM (SELECT customer_id, name FROM customers ORDER BY customer_id)\n) AS __ava_query LIMIT 3',
          clickhouse_settings: { readonly: '1' },
        })
      );
    } finally {
      await ava.dispose();
    }
  });

  it('profiles ClickHouse tables with quoted identifiers and normalized top values', async () => {
    const run = vi
      .fn<(sql: string) => Promise<Record<string, unknown>[]>>()
      .mockResolvedValue([{ m0: '4', m1: '25', m2: '35.5', m3: '[["gift wrap",2]]', m4: '1709283600000' }]);
    const schema: Schema = {
      tables: [
        {
          name: 'order notes',
          columnCount: 3,
          indexes: [],
          fields: [
            { name: 'amount', type: 'Decimal(10, 2)' },
            { name: 'note"text', type: 'String' },
            { name: 'placed_at', type: 'DateTime' },
          ],
        },
      ],
    };

    const result = await clickhouseProfile(run, schema, {
      metrics: [{ id: 'row_count' }, { id: 'mean' }, { id: 'top_values' }, { id: 'max' }],
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(result.tables[0].metrics.row_count).toBe(4);
    expect(result.tables[0].fields[0].metrics.mean).toBe(25);
    expect(result.tables[0].fields[1].metrics.top_values).toEqual([{ value: 'gift wrap', count: 2 }]);
    expect(result.tables[0].fields[2].metrics.max).toBe(1709283600000);
    const query = run.mock.calls[0][0];
    expect(query).toContain('toJSONString(groupArray((v, n)))');
    expect(query).toContain('"order notes"');
    expect(query).toContain('"note""text"');
  });

  it('rejects unloaded engines and incompatible sources', async () => {
    stubClient((query) => {
      if (query.includes('FROM system.tables')) return TABLE_ROWS;
      if (query.includes('FROM system.columns')) return COLUMN_ROWS;
      return [];
    });
    const engine = new ClickHouseEngine(getLLMConfig());
    await expect(engine.profile()).rejects.toThrow('No data loaded');
    await engine.load({
      type: 'clickhouse',
      options: { host: 'http://localhost:8123', database: 'default', username: 'default', password: '' },
    });
    await expect(engine.load({ type: 'csv-file', options: { path: 'unused' } })).rejects.toThrow('only supports');
    await expect(engine.profile()).rejects.toThrow('No data loaded');
  });
});
