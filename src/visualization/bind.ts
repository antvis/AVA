import { z } from 'zod';

import { chartSpecSchema, bindingSchema } from '../contracts/visualize';
import { executionResultSchema } from '../contracts/query';
import { dataRowSchema } from '../contracts/shared/json';

import type { ChartSpec, ChartType, ChartDataBinding } from '../contracts/visualize';
import type { ExecutionResult } from '../contracts/query';

/**
 * Validate a query result and project explicit native chart fields without coercion.
 * Omit binding for native data arrays. configField reads a native config object from one result cell.
 * The caller decides whether a truncated result is suitable for its chart.
 */
export function bindChartData(
  input: ExecutionResult<unknown>,
  spec: { chartType: Exclude<ChartType, 'summary'>; config?: Record<string, unknown> },
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
    const row = dataRowSchema.parse(result.data[0]);
    data = dataRowSchema.parse(row[parsed.configField]);
  } else {
    const fields = parsed && 'fields' in parsed ? parsed.fields : undefined;
    data = {
      data: fields
        ? z
            .array(dataRowSchema)
            .parse(result.data)
            .map((row) => Object.fromEntries(Object.entries(fields).map(([native, column]) => [native, row[column]])))
        : result.data,
    };
  }
  return chartSpecSchema.parse({ chartType: spec.chartType, config: { ...config, ...data } });
}
