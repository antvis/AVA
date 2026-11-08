import { z } from 'zod';

import { chartSpecSchema } from '../contracts/chart';
import { executionResultSchema } from '../contracts/result';

import type { ChartSpec, ChartType } from '../contracts/chart';
import type { ExecutionResult } from '../contracts/result';

const rowSchema = z.record(z.string(), z.unknown());
const bindingSchema = z.union([
  z
    .object({ fields: z.record(z.string(), z.string().min(1)).refine((fields) => Object.keys(fields).length > 0) })
    .strict(),
  z.object({ configField: z.string().min(1) }).strict(),
]);

export type ChartDataBinding = z.infer<typeof bindingSchema>;

/**
 * Validate a query result and project explicit native chart fields without coercion.
 * Omit binding for native data arrays. configField reads a native config object from one result cell.
 * The caller decides whether a truncated result is suitable for its chart.
 */
export function bindChartData(
  input: ExecutionResult<unknown>,
  spec: { chartType: ChartType; config?: Record<string, unknown> },
  binding?: ChartDataBinding
): ChartSpec {
  const result = executionResultSchema.parse(input);
  const config = spec.config ?? {};
  for (const key of ['data', 'categories', 'series', 'percent']) {
    if (Object.prototype.hasOwnProperty.call(config, key)) throw new Error(`config.${key} must come from the result`);
  }
  const parsed = binding === undefined ? undefined : bindingSchema.parse(binding);
  const columns = new Set(result.schema.map((column) => column.name));
  const names = parsed && ('fields' in parsed ? Object.values(parsed.fields) : [parsed.configField]);
  for (const name of names ?? []) {
    if (!columns.has(name)) throw new Error(`Unknown result column: ${name}`);
  }
  let data: Record<string, unknown>;
  if (parsed && 'configField' in parsed) {
    if (result.data.length !== 1) throw new Error('configField requires exactly one result row');
    const row = rowSchema.parse(result.data[0]);
    data = rowSchema.parse(row[parsed.configField]);
  } else {
    const fields = parsed && 'fields' in parsed ? parsed.fields : undefined;
    data = {
      data: fields
        ? z
            .array(rowSchema)
            .parse(result.data)
            .map((row) => Object.fromEntries(Object.entries(fields).map(([native, column]) => [native, row[column]])))
        : result.data,
    };
  }
  return chartSpecSchema.parse({ chartType: spec.chartType, config: { ...config, ...data } });
}
