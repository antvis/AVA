/**
 * SQL Server schema-discovery tests that exercise the catalog query logic
 * directly, without a live database or the in-memory connector.
 */
import { describe, expect, it, vi } from 'vitest';

import { getSqlServerSchema } from '../../../src/remote/sqlserver/schema';

type Row = Record<string, unknown>;

function rowsFor(sql: string): Row[] {
  if (sql.includes('INFORMATION_SCHEMA.TABLES')) {
    return [{ table_schema: 'dbo', table_name: 'orders' }];
  }
  if (sql.includes('INFORMATION_SCHEMA.COLUMNS')) {
    return [
      { table_schema: 'dbo', table_name: 'orders', name: 'OrderID', type: 'int', nullable: 'NO' },
      { table_schema: 'dbo', table_name: 'orders', name: 'CustomerID', type: 'int', nullable: 'NO' },
      { table_schema: 'dbo', table_name: 'orders', name: 'Note', type: 'nvarchar', nullable: 'YES' },
    ];
  }
  if (sql.includes('INFORMATION_SCHEMA.KEY_COLUMN_USAGE')) {
    return [
      // A real primary key and a foreign key share KEY_COLUMN_USAGE.
      { table_schema: 'dbo', table_name: 'orders', constraint_name: 'PK_orders', name: 'OrderID', position: 1 },
      { table_schema: 'dbo', table_name: 'orders', constraint_name: 'FK_orders_customer', name: 'CustomerID', position: 1 },
      { table_schema: 'dbo', table_name: 'orders', constraint_name: 'UQ_orders_note', name: 'Note', position: 1 },
    ];
  }
  if (sql.includes('INFORMATION_SCHEMA.TABLE_CONSTRAINTS')) {
    return [{ table_schema: 'dbo', table_name: 'orders', constraint_name: 'PK_orders' }];
  }
  return [];
}

describe('getSqlServerSchema', () => {
  it('keeps only primary-key columns from KEY_COLUMN_USAGE', async () => {
    const run = vi.fn(async (sql: string) => rowsFor(sql));
    const schema = await getSqlServerSchema(run, 'demo');

    expect(schema.models).toHaveLength(1);
    expect(schema.models[0].primaryKey).toBe('OrderID');
    expect(run.mock.calls.some(([sql]) => sql.includes('CONSTRAINT_TYPE'))).toBe(true);
  });

  it('preserves a composite primary key in key order', async () => {
    const run = vi.fn(async (sql: string) => {
      if (sql.includes('INFORMATION_SCHEMA.TABLES')) return [{ table_schema: 'dbo', table_name: 'order_lines' }];
      if (sql.includes('INFORMATION_SCHEMA.COLUMNS')) {
        return [
          { table_schema: 'dbo', table_name: 'order_lines', name: 'OrderID', type: 'int', nullable: 'NO' },
          { table_schema: 'dbo', table_name: 'order_lines', name: 'LineID', type: 'int', nullable: 'NO' },
        ];
      }
      if (sql.includes('INFORMATION_SCHEMA.KEY_COLUMN_USAGE')) {
        return [
          { table_schema: 'dbo', table_name: 'order_lines', constraint_name: 'PK_lines', name: 'LineID', position: 2 },
          { table_schema: 'dbo', table_name: 'order_lines', constraint_name: 'PK_lines', name: 'OrderID', position: 1 },
        ];
      }
      if (sql.includes('INFORMATION_SCHEMA.TABLE_CONSTRAINTS')) {
        return [{ table_schema: 'dbo', table_name: 'order_lines', constraint_name: 'PK_lines' }];
      }
      return [];
    });

    const schema = await getSqlServerSchema(run, 'demo');
    expect(schema.models[0].primaryKey).toEqual(['OrderID', 'LineID']);
  });

  it('keeps same-named tables in different schemas separate', async () => {
    const run = vi.fn(async (sql: string) => {
      if (sql.includes('INFORMATION_SCHEMA.TABLES')) {
        return [
          { table_schema: 'dbo', table_name: 'orders' },
          { table_schema: 'sales', table_name: 'orders' },
        ];
      }
      if (sql.includes('INFORMATION_SCHEMA.COLUMNS')) {
        return [
          { table_schema: 'dbo', table_name: 'orders', name: 'OrderID', type: 'int', nullable: 'NO' },
          { table_schema: 'sales', table_name: 'orders', name: 'Region', type: 'nvarchar', nullable: 'YES' },
        ];
      }
      if (sql.includes('INFORMATION_SCHEMA.KEY_COLUMN_USAGE')) {
        return [
          { table_schema: 'dbo', table_name: 'orders', constraint_name: 'PK_orders', name: 'OrderID', position: 1 },
          { table_schema: 'sales', table_name: 'orders', constraint_name: 'PK_orders', name: 'Region', position: 1 },
        ];
      }
      if (sql.includes('INFORMATION_SCHEMA.TABLE_CONSTRAINTS')) {
        return [
          { table_schema: 'dbo', table_name: 'orders', constraint_name: 'PK_orders' },
          { table_schema: 'sales', table_name: 'orders', constraint_name: 'PK_orders' },
        ];
      }
      return [];
    });

    const schema = await getSqlServerSchema(run, 'demo');
    expect(schema.models.map((model) => model.name)).toEqual(['dbo.orders', 'sales.orders']);
    expect(schema.models.map((model) => model.tableReference)).toEqual([
      { catalog: 'demo', schema: 'dbo', table: 'orders' },
      { catalog: 'demo', schema: 'sales', table: 'orders' },
    ]);
    expect(schema.models[0].columns.map((column) => column.name)).toEqual(['OrderID']);
    expect(schema.models[1].columns.map((column) => column.name)).toEqual(['Region']);
    expect(schema.models[0].primaryKey).toBe('OrderID');
    expect(schema.models[1].primaryKey).toBe('Region');
  });

  it('runs catalog queries sequentially for a single Tedious connection', async () => {
    let active = 0;
    let maxActive = 0;
    const run = vi.fn(async (sql: string) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return rowsFor(sql);
    });

    await getSqlServerSchema(run, 'demo');
    expect(maxActive).toBe(1);
  });
});
