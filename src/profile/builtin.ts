import { registerMetric } from './registry';

import type { LogicalType, Metric } from './types';

const table: Metric['enable'] = ({ target }) => target === 'table';
const column: Metric['enable'] = ({ target }) => target === 'column';
const logicalTypes =
  (...types: LogicalType[]): Metric['enable'] =>
  ({ target, field }) =>
    target === 'column' && !!field && types.includes(field.logicalType);

/**
 * Built-in metrics for table and column profiles.
 */
export const builtinMetrics: Metric[] = [
  { id: 'row_count', enable: table },
  { id: 'null_count', enable: column },
  { id: 'distinct_count', enable: logicalTypes('numeric', 'string', 'boolean', 'date') },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: {
      limit: {
        type: 'number',
        default: 3,
        validate: (value) => {
          if (!Number.isSafeInteger(value) || value < 0) {
            throw new Error('top_values.limit must be a non-negative safe integer');
          }
        },
      },
      maxDistinctRatio: {
        type: 'number',
        default: 0.5,
        validate: (value) => {
          if (!Number.isFinite(value) || value < 0 || value > 1) {
            throw new Error('top_values.maxDistinctRatio must be between 0 and 1');
          }
        },
      },
    },
  },
  { id: 'duplicate_count', enable: column },
  { id: 'min', enable: logicalTypes('numeric', 'date') },
  { id: 'max', enable: logicalTypes('numeric', 'date') },
  { id: 'min_length', enable: logicalTypes('string') },
  { id: 'max_length', enable: logicalTypes('string') },
  { id: 'mean', enable: logicalTypes('numeric') },
  { id: 'sum', enable: logicalTypes('numeric') },
  { id: 'stddev', enable: logicalTypes('numeric') },
  { id: 'median', enable: logicalTypes('numeric') },
];

builtinMetrics.forEach(registerMetric);

export const DEFAULT_METRICS: string[] = [
  'row_count',
  'null_count',
  'distinct_count',
  'top_values',
  'min',
  'max',
  'mean',
];
