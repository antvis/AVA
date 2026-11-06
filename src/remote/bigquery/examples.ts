/**
 * Seed data used by documentation examples and tests that run against the
 * built-in mock connector. It models a small retail schema so the two
 * natural-language examples in the README can be answered end-to-end.
 */
import type { MockTableSeed } from '../../types';

/** A tiny sales schema seeded into the in-memory adapter. */
export const BIGQUERY_TABLE_SEED: MockTableSeed[] = [
  {
    name: 'orders',
    columns: [
      { name: 'order_id', type: 'INT64', notNull: true },
      { name: 'region', type: 'STRING', notNull: false },
      { name: 'product', type: 'STRING', notNull: true },
      { name: 'units', type: 'INT64', notNull: true },
      { name: 'revenue', type: 'NUMERIC', notNull: false },
      { name: 'order_date', type: 'DATE', notNull: false },
    ],
    primaryKey: 'order_id',
    rows: [
      { order_id: 1, region: 'North', product: 'Chair', units: 10, revenue: 120, order_date: '2023-01-02' },
      { order_id: 2, region: 'South', product: 'Desk', units: 5, revenue: 350, order_date: '2023-01-15' },
      { order_id: 3, region: 'North', product: 'Desk', units: 2, revenue: 140, order_date: '2023-02-01' },
      { order_id: 4, region: 'West', product: 'Chair', units: 8, revenue: 96, order_date: '2023-02-10' },
      { order_id: 5, region: 'South', product: 'Lamp', units: 12, revenue: 144, order_date: '2023-03-05' },
      { order_id: 6, region: 'West', product: 'Desk', units: 3, revenue: 210, order_date: '2023-03-20' },
    ],
  },
  {
    name: 'customers',
    columns: [
      { name: 'customer_id', type: 'INT64', notNull: true },
      { name: 'name', type: 'STRING', notNull: true },
    ],
    primaryKey: 'customer_id',
    rows: [
      { customer_id: 1, name: 'Alice' },
      { customer_id: 2, name: 'Bob' },
      { customer_id: 3, name: 'Carol' },
    ],
  },
];