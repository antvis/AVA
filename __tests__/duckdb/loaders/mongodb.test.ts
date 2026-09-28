import { describe, expect, it, vi } from 'vitest';

import { loadMongoDB } from '../../../src/duckdb/loaders/mongodb';

import type { DuckDBConnection } from '../../../src/types';

function createConnection(rows: Record<string, unknown>[] = []): DuckDBConnection & {
  run: ReturnType<typeof vi.fn>;
  runAndReadAll: ReturnType<typeof vi.fn>;
} {
  return {
    run: vi.fn().mockResolvedValue(undefined),
    runAndReadAll: vi.fn().mockResolvedValue({ getRowObjectsJson: () => rows }),
  };
}

describe('loaders/mongodb', () => {
  it('installs the mongo community extension, attaches the database, and exposes collections as views', async () => {
    const source = await loadMongoDB({
      connection: 'host=localhost port=27017',
      database: 'sales',
    });
    const conn = createConnection([{ table_name: 'orders' }, { table_name: 'users' }]);

    await expect(source.register(conn)).resolves.toEqual(['orders', 'users']);
    expect(conn.run.mock.calls.map(([sql]) => sql)).toEqual([
      'INSTALL mongo FROM community',
      'LOAD mongo',
      'SET mongo_enable_direct_scan = false',
      "ATTACH 'host=localhost port=27017 dbname=sales' AS mongo_source (TYPE MONGO)",
      'CREATE OR REPLACE VIEW "orders" AS SELECT * FROM "mongo_source"."sales"."orders"',
      'CREATE OR REPLACE VIEW "users" AS SELECT * FROM "mongo_source"."sales"."users"',
    ]);
  });

  it('preserves database selection already encoded in a MongoDB URI', async () => {
    const source = await loadMongoDB({
      connection: 'mongodb://localhost:27017/analytics?retryWrites=true',
      database: 'sales',
    });
    const conn = createConnection([]);

    await source.register(conn);

    expect(conn.run).toHaveBeenCalledWith(
      "ATTACH 'mongodb://localhost:27017/analytics?retryWrites=true' AS mongo_source (TYPE MONGO)"
    );
  });

  it('returns structural schema from the created views', async () => {
    const source = await loadMongoDB({
      connection: 'host=localhost port=27017',
      database: 'sales',
    });
    const conn = createConnection([{ table_name: 'orders' }]);

    await source.register(conn);
    conn.runAndReadAll.mockResolvedValueOnce({
      getRowObjectsJson: () => [
        {
          kind: 'column',
          table_name: 'orders',
          metadata: JSON.stringify({ name: 'amount', type: 'DOUBLE', nullable: true, position: 0 }),
        },
      ],
    });

    await expect(source.getSchema(conn)).resolves.toEqual({
      tables: [
        {
          name: 'orders',
          columnCount: 1,
          fields: [{ name: 'amount', type: 'DOUBLE', nullable: true }],
          indexes: [],
        },
      ],
      relations: [],
    });
  });
});
