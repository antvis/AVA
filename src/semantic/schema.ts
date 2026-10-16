import { z } from 'zod';

const identifier = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'must start with a letter or underscore and contain only letters, digits and underscores');
const tableName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*){0,2}$/, 'invalid table name');
const column = z.string().min(1);

const sqlFragment = z
  .string()
  .min(1)
  .refine((value) => !/;|--|\/\*/.test(value), 'must not contain ";" or SQL comments');

const dimensionSchema = z
  .object({
    name: identifier,
    description: z.string().optional(),
    column: column.optional(),
    expr: sqlFragment.optional(),
    type: z.enum(['string', 'number', 'boolean', 'time']).optional(),
  })
  .refine((d) => (d.column === undefined) !== (d.expr === undefined), 'exactly one of column or expr is required');

const measureSchema = z
  .object({
    name: identifier,
    description: z.string().optional(),
    agg: z.enum(['sum', 'count', 'count_distinct', 'avg', 'min', 'max']).optional(),
    column: column.optional(),
    expr: sqlFragment.optional(),
  })
  .refine((m) => !(m.column !== undefined && m.expr !== undefined), 'column and expr are mutually exclusive')
  .refine((m) => m.agg !== undefined || m.expr !== undefined, 'agg or a full aggregate expr is required')
  .refine((m) => m.agg === undefined || m.agg === 'count' || m.column !== undefined || m.expr !== undefined, 'agg requires column or expr');

const modelSchema = z.object({
  name: identifier.refine((n) => !n.includes('__'), 'must not contain "__"'),
  table: tableName,
  description: z.string().optional(),
  dimensions: z.array(dimensionSchema).optional(),
  measures: z.array(measureSchema).optional(),
});

const joinSchema = z.object({
  from: identifier,
  to: identifier,
  keys: z.array(z.object({ from: column, to: column })).min(1),
  type: z.enum(['inner', 'left']).optional(),
});

export const semanticConfigSchema = z.object({
  models: z.array(modelSchema).min(1),
  joins: z.array(joinSchema).optional(),
  dialect: z.enum(['duckdb', 'postgresql', 'clickhouse', 'mysql', 'ansi']).optional(),
});

export const smqSchema = z.object({
  metrics: z.array(z.string()).optional(),
  filters: z.array(z.string()).optional(),
  group_by: z.array(z.string()).optional(),
  order_by: z
    .array(z.object({ field: z.string(), direction: z.enum(['asc', 'desc']).optional() }))
    .optional(),
  limit: z.number().int().positive().max(1_000_000).optional(),
});
