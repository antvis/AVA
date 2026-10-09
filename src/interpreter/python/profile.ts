import { column, logicalTypes, table, TOP_VALUES_OPTIONS, validateMetricConfig } from '../../util/profile';

import { SCHEMA_CODE } from './util/schema';

import type { LogicalType, Metric, ParsedProfileOptions } from '../../types';

/** Python expressions receive the same per-target context as JavaScript interpreter metrics. */
export const BUILTIN_METRICS: Metric<string>[] = [
  { id: 'row_count', enable: table, expression: 'ctx.row_count' },
  { id: 'null_count', enable: column, expression: 'ctx.row_count - len(ctx.values)' },
  {
    id: 'distinct_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: 'len(ctx.distinct)',
  },
  { id: 'duplicate_count', enable: column, expression: 'len(ctx.values) - len(ctx.distinct)' },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: TOP_VALUES_OPTIONS,
    expression: `([{'value': value, 'count': count} for value, count in
        sorted(ctx.distinct.items(), key=lambda pair: (-pair[1], pair[0]))[:ctx.metric.get('limit', 3)]]
        if len(ctx.distinct) <= ctx.row_count * ctx.metric.get('maxDistinctRatio', 0.5) else SKIP)`,
  },
  { id: 'min', enable: logicalTypes('numeric', 'date'), expression: 'ctx.numbers.min() if len(ctx.numbers) else None' },
  { id: 'max', enable: logicalTypes('numeric', 'date'), expression: 'ctx.numbers.max() if len(ctx.numbers) else None' },
  { id: 'min_length', enable: logicalTypes('string'), expression: 'min(map(len, ctx.values), default=None)' },
  { id: 'max_length', enable: logicalTypes('string'), expression: 'max(map(len, ctx.values), default=None)' },
  { id: 'mean', enable: logicalTypes('numeric'), expression: 'ctx.numbers.mean() if len(ctx.numbers) else None' },
  { id: 'sum', enable: logicalTypes('numeric'), expression: 'ctx.numbers.sum() if len(ctx.numbers) else None' },
  { id: 'stddev', enable: logicalTypes('numeric'), expression: 'ctx.numbers.std() if len(ctx.numbers) > 1 else None' },
  { id: 'median', enable: logicalTypes('numeric'), expression: 'ctx.numbers.median() if len(ctx.numbers) else None' },
];

/** Build fixed pandas statistics; only metadata is returned to AVA. */
export function profileCode(options: ParsedProfileOptions): string {
  const kinds: LogicalType[] = ['numeric', 'string', 'boolean', 'date', 'unknown'];

  const metrics = options.metrics.map((metric) => {
    validateMetricConfig(metric, BUILTIN_METRICS);

    const definition = BUILTIN_METRICS.find(({ id }) => id === metric.id)!;
    const targets = definition.enable({ target: 'table' })
      ? ['table']
      : kinds.filter((logicalType) => definition.enable({ target: 'column', field: { logicalType } }));

    return { ...metric, targets };
  });

  const expressions = BUILTIN_METRICS.filter(({ id }) => metrics.some((metric) => metric.id === id))
    .map(({ id, expression }) => `${JSON.stringify(id)}: lambda ctx: ${expression}`)
    .join(',\n    ');

  return `${SCHEMA_CODE}
import json
import math
from collections import Counter
from functools import cached_property

SKIP = object()
metrics = json.loads(${JSON.stringify(JSON.stringify(metrics))})
expressions = {
    ${expressions}
}

def logical_type(series):
    if pd.api.types.is_bool_dtype(series.dtype):
        return 'boolean'
    if pd.api.types.is_numeric_dtype(series.dtype):
        return 'numeric'
    if pd.api.types.is_datetime64_any_dtype(series.dtype):
        return 'date'

    inferred = pd.api.types.infer_dtype(series, skipna=True)
    if inferred == 'boolean':
        return 'boolean'
    if inferred in ('string', 'unicode', 'empty'):
        return 'string'

    return 'unknown'

class Context:
    def __init__(self, frame, field):
        self.row_count = len(frame)
        self.series = frame[field['name']] if field is not None else None
        self.kind = field['logicalType'] if field is not None else 'table'
        self.metric = None

    # Compute each intermediate only when requested, once per target.
    @cached_property
    def values(self):
        values = self.series.dropna()
        if self.kind == 'date':
            values = values.map(lambda value: value.value / 1_000_000)

        return values

    @cached_property
    def numbers(self):
        return self.values[self.values.map(math.isfinite).astype(bool)]

    @cached_property
    def distinct(self):
        values = self.values.tolist()
        if self.kind == 'unknown':
            # Like the JavaScript interpreter, object equality remains key-order sensitive.
            values = [json.dumps(value, ensure_ascii=False, separators=(',', ':')) for value in values]

        return Counter(values)

for table in result:
    frame = tables[table['name']]
    table['metrics'] = {}

    for field in table['fields']:
        field.update(logicalType=logical_type(frame[field['name']]), metrics={})

    targets = [(table['metrics'], None)] + [(field['metrics'], field) for field in table['fields']]

    for output, field in targets:
        ctx = Context(frame, field)
        for metric in metrics:
            if ctx.kind not in metric['targets']:
                continue

            ctx.metric = metric
            value = expressions[metric['id']](ctx)

            # A later request replaces the earlier result, even when skipped.
            output.pop(metric['id'], None)

            if value is not SKIP:
                if hasattr(value, 'item'):
                    value = value.item()

                output[metric['id']] = None if isinstance(value, float) and not math.isfinite(value) else value
`;
}
