/**
 * Seed data used by documentation examples and tests that run against the
 * built-in mock connector. It models a small retail schema so the two
 * natural-language examples in the README can be answered end-to-end.
 */
import type { MockTableSeed } from '../../types';

/** A tiny sales schema seeded into the in-memory adapter. */
export const SQLSERVER_TABLE_SEED: MockTableSeed[] = [
  {
    name: 'orders',
    columns: [
      { name: 'OrderID', type: 'int', notNull: true },
      { name: 'Region', type: 'nvarchar', notNull: false },
      { name: 'Product', type: 'nvarchar', notNull: true },
      { name: 'Units', type: 'int', notNull: true },
      { name: 'Revenue', type: 'decimal', notNull: false },
    ],
    primaryKey: 'OrderID',
    rows: [
      { OrderID: 1, Region: 'North', Product: 'Chair', Units: 10, Revenue: 120 },
      { OrderID: 2, Region: 'South', Product: 'Desk', Units: 5, Revenue: 350 },
      { OrderID: 3, Region: 'North', Product: 'Desk', Units: 2, Revenue: 140 },
      { OrderID: 4, Region: 'West', Product: 'Chair', Units: 8, Revenue: 96 },
      { OrderID: 5, Region: 'South', Product: 'Lamp', Units: 12, Revenue: 144 },
      { OrderID: 6, Region: 'West', Product: 'Desk', Units: 3, Revenue: 210 },
    ],
  },
  {
    name: 'customers',
    columns: [
      { name: 'CustomerID', type: 'int', notNull: true },
      { name: 'Name', type: 'nvarchar', notNull: true },
    ],
    primaryKey: 'CustomerID',
    rows: [
      { CustomerID: 1, Name: 'Alice' },
      { CustomerID: 2, Name: 'Bob' },
      { CustomerID: 3, Name: 'Carol' },
    ],
  },
];