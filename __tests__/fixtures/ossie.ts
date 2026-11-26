import type { Semantic } from '../../src';

export const ossieModel: Semantic = {
  version: '0.3.0.dev0',
  name: 'sales',
  description: 'Sales definitions',
  datasets: [
    {
      name: 'orders',
      source: 'data',
      fields: [{ name: 'amount', expression: { sql: 'value' }, description: 'Amount in USD.' }],
      metrics: [{ name: 'total', expression: { sql: 'SUM(amount)' }, datatype: 'Decimal' }],
    },
  ],
};
