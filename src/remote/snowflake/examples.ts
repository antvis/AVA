/**
 * Seed data used by documentation examples and tests that run against the
 * built-in mock connector. It models a small retail schema so the two
 * natural-language examples in the README can be answered end-to-end. The
 * second table spans the PUBLIC schema; the first spans the same schema with a
 * domain-style dimension to exercise joins with dotted identifiers.
 */
import type { MockTableSeed } from '../../types';

/** A tiny sales schema seeded into the in-memory adapter. */
export const SNOWFLAKE_TABLE_SEED: MockTableSeed[] = [
  {
    name: 'orders',
    schema: 'PUBLIC',
    columns: [
      { name: 'OrderID', type: 'NUMBER', notNull: true },
      { name: 'Region', type: 'VARCHAR', notNull: false },
      { name: 'Product', type: 'VARCHAR', notNull: true },
      { name: 'Units', type: 'NUMBER', notNull: true },
      { name: 'Revenue', type: 'NUMBER', notNull: false },
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
    schema: 'PUBLIC',
    columns: [
      { name: 'CustomerID', type: 'NUMBER', notNull: true },
      { name: 'Name', type: 'VARCHAR', notNull: true },
    ],
    primaryKey: 'CustomerID',
    rows: [
      { CustomerID: 1, Name: 'Alice' },
      { CustomerID: 2, Name: 'Bob' },
      { CustomerID: 3, Name: 'Carol' },
    ],
  },
  {
    name: 'products',
    schema: 'PUBLIC',
    columns: [
      { name: 'Product', type: 'VARCHAR', notNull: true },
      { name: 'Category', type: 'VARCHAR', notNull: false },
      { name: 'Unit', type: 'NUMBER', notNull: true },
    ],
    primaryKey: 'Product',
    rows: [
      { Product: 'Chair', Category: 'Furniture', Unit: 12 },
      { Product: 'Desk', Category: 'Furniture', Unit: 70 },
      { Product: 'Lamp', Category: 'Lighting', Unit: 12 },
    ],
  },
];
