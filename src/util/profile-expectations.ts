import { profileOutputSchema } from '../contracts';

import type { JsonValue } from '../types';

type Expectation = { expectation_type: string; kwargs: Record<string, JsonValue>; meta?: Record<string, JsonValue> };

const numericTypes = [
  'BIGINT',
  'BYTEINT',
  'ByteType()',
  'INT',
  'INT64',
  'INTEGER',
  'Int16Dtype',
  'Int32Dtype',
  'Int64Dtype',
  'Int8Dtype',
  'IntegerType',
  'IntegerType()',
  'LongType',
  'LongType()',
  'SMALLINT',
  'ShortType()',
  'TINYINT',
  'UInt16Dtype',
  'UInt32Dtype',
  'UInt64Dtype',
  'UInt8Dtype',
  'int',
  'int16',
  'int32',
  'int64',
  'int8',
  'int_',
  'integer',
  'uint16',
  'uint32',
  'uint64',
  'uint8',
  'Uint8',
  'Uint16',
  'Uint32',
  'Uint64',
  'Uint128',
  'Uint256',
  'Int8',
  'Int16',
  'Int32',
  'Int64',
  'Int128',
  'Int256',
  'DECIMAL',
  'DOUBLE',
  'DOUBLE_PRECISION',
  'DecimalType()',
  'DoubleType',
  'DoubleType()',
  'FLOAT',
  'FLOAT4',
  'FLOAT64',
  'FLOAT8',
  'FloatType',
  'FloatType()',
  'NUMERIC',
  'REAL',
  'float',
  'float16',
  'float32',
  'float64',
  'float_',
  'number',
  'Float32',
  'Float64',
];

function property(value: JsonValue | undefined, name: string): JsonValue | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value[name] : undefined;
}

function bound(value: JsonValue | undefined, date: boolean): string | number | null {
  if (typeof value !== 'number') return null;
  if (!date) return value;
  return Math.abs(value) <= 8.64e15 ? new Date(value).toISOString() : null;
}

/** Build a legacy Great Expectations suite for each model from saved observations. */
export function profileExpectations(input: unknown, { name = 'ava_profile' }: { name?: string } = {}) {
  const profile = profileOutputSchema.parse(input);
  if (!name.trim()) throw new Error('Expectation suite name must be nonempty');
  return profile.models.map((model) => {
    const expectations: Expectation[] = [];
    for (const {
      name: column,
      properties: { logicalType, profileType },
      metrics,
    } of model.columns) {
      const add = (type: string, options: Record<string, JsonValue> = {}, meta?: Record<string, JsonValue>) => {
        expectations.push({ expectation_type: type, kwargs: { column, ...options }, ...(meta && { meta }) });
      };
      add('expect_column_to_exist');
      if (
        (metrics.null_count === 0 || metrics.null_ratio === 0) &&
        (profile.semantics === 'data-profiling' || !metrics.nan_count)
      )
        add('expect_column_values_to_not_be_null');
      if (metrics.unique_ratio === 1 || metrics.is_unique === true) add('expect_column_values_to_be_unique');
      if (logicalType === 'numeric') {
        add(
          'expect_column_values_to_be_in_type_list',
          { type_list: [...numericTypes] },
          {
            notes: { format: 'markdown', content: ['The column values should be stored in one of these types.'] },
          }
        );
        for (const [direction, key] of [
          ['increasing', 'strictly_increasing'],
          ['decreasing', 'strictly_decreasing'],
        ]) {
          if (property(metrics.monotonicity, direction) === true) {
            add(`expect_column_values_to_be_${direction}`, { strictly: property(metrics.monotonicity, key) === true });
          }
        }
      }
      if (logicalType === 'numeric' || logicalType === 'date') {
        const date = logicalType === 'date';
        const min_value = bound(metrics.min, date);
        const max_value = bound(metrics.max, date);
        if (min_value !== null || max_value !== null)
          add('expect_column_values_to_be_between', {
            min_value,
            max_value,
            ...(date && { parse_strings_as_datetimes: true }),
          });
      }
      if (
        (logicalType === 'boolean' ||
          (logicalType === 'string' && (!profileType || profileType === 'Text' || profileType === 'Categorical'))) &&
        ((typeof metrics.distinct_count === 'number' && metrics.distinct_count < 10) ||
          (typeof metrics.distinct_ratio === 'number' && metrics.distinct_ratio < 0.2)) &&
        Array.isArray(metrics.value_counts)
      ) {
        const values = metrics.value_counts.map((entry) => property(entry, 'value'));
        if (
          values.length &&
          values.every((value) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
        ) {
          add('expect_column_values_to_be_in_set', { value_set: values as JsonValue[] });
        }
      }
      if (profileType === 'File' || profileType === 'Image') {
        if (metrics.file_summary) add('expect_file_to_exist');
      }
    }
    return {
      model: model.name,
      expectation_suite_name: profile.models.length === 1 ? name : `${name}.${model.name}`,
      expectations,
    };
  });
}

export type ProfileExpectationSuite = ReturnType<typeof profileExpectations>[number];
