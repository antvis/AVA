import { z } from 'zod';

import { profileOutputSchema } from '../contracts';
import { jsonValue } from '../contracts/shared/json';

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

const suiteInput = z.array(
  z.object({
    model: z.string(),
    expectation_suite_name: z.string(),
    expectations: z.array(
      z.object({
        expectation_type: z.string(),
        kwargs: z.record(z.string(), jsonValue).and(z.object({ column: z.string() })),
      })
    ),
  })
);

function validateExpectation(
  expectation: z.output<typeof suiteInput>[number]['expectations'][number],
  column: z.output<typeof profileOutputSchema>['models'][number]['columns'][number] | undefined,
  referenceSemantics: boolean
): boolean | undefined {
  const { expectation_type: rule, kwargs } = expectation;
  if (rule === 'expect_column_to_exist') return column !== undefined;
  if (!column) return false;
  const { metrics, properties } = column;
  switch (rule) {
    case 'expect_column_values_to_not_be_null': {
      const missing = metrics.null_count ?? metrics.null_ratio;
      if (typeof missing !== 'number') return undefined;
      return missing === 0 && (referenceSemantics || !metrics.nan_count);
    }
    case 'expect_column_values_to_be_unique':
      return typeof metrics.is_unique === 'boolean'
        ? metrics.is_unique
        : typeof metrics.unique_ratio === 'number'
        ? metrics.unique_ratio === 1
        : undefined;
    case 'expect_column_values_to_be_in_type_list': {
      const types = z.array(z.string()).parse(kwargs.type_list);
      if (!numericTypes.every((type) => types.includes(type))) return undefined;
      return properties.logicalType === 'numeric';
    }
    case 'expect_column_values_to_be_increasing':
    case 'expect_column_values_to_be_decreasing': {
      const direction = rule.endsWith('increasing') ? 'increasing' : 'decreasing';
      const flag = property(metrics.monotonicity, kwargs.strictly === true ? `strictly_${direction}` : direction);
      return typeof flag === 'boolean' ? flag : undefined;
    }
    case 'expect_column_values_to_be_between': {
      const parseBound = (value: JsonValue | undefined) => {
        if (value == null) return undefined;
        const parsed =
          kwargs.parse_strings_as_datetimes === true ? Date.parse(z.string().parse(value)) : z.number().parse(value);
        if (!Number.isFinite(parsed)) throw new Error('Invalid expectation bound');
        return parsed;
      };
      const low = parseBound(kwargs.min_value);
      const high = parseBound(kwargs.max_value);
      const observed = (value: JsonValue | undefined) =>
        typeof value === 'number'
          ? value
          : value === 'Infinity'
          ? Infinity
          : value === '-Infinity'
          ? -Infinity
          : undefined;
      const min = observed(metrics.min);
      const max = observed(metrics.max);
      if ((low !== undefined && min === undefined) || (high !== undefined && max === undefined)) return undefined;
      return (low === undefined || min! >= low) && (high === undefined || max! <= high);
    }
    case 'expect_column_values_to_be_in_set': {
      const allowed = new Set(z.array(z.union([z.string(), z.number(), z.boolean()])).parse(kwargs.value_set));
      if (!Array.isArray(metrics.value_counts)) return undefined;
      return metrics.value_counts.every((entry) => {
        const value = property(entry, 'value');
        return (
          (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') && allowed.has(value)
        );
      });
    }
    case 'expect_file_to_exist':
      return Array.isArray(property(metrics.file_summary, 'files')) ? true : undefined;
    default:
      throw new Error(`Unknown profile expectation: ${rule}`);
  }
}

export function validateProfileExpectations(input: unknown, suites: unknown) {
  const profile = profileOutputSchema.parse(input);
  const models = new Map(profile.models.map((model) => [model.name, model]));
  const results = suiteInput.parse(suites).map((suite) => {
    const model = models.get(suite.model);
    const columns = new Map(model?.columns.map((column) => [column.name, column]));
    const expectations = suite.expectations.map((expectation) => {
      const column = expectation.kwargs.column;
      const passes = validateExpectation(expectation, columns.get(column), profile.semantics === 'data-profiling');
      return {
        column,
        expectation_type: expectation.expectation_type,
        status: passes === undefined ? 'missing_evidence' : passes ? 'passed' : 'failed',
      };
    });
    return { model: suite.model, expectation_suite_name: suite.expectation_suite_name, expectations };
  });
  return {
    success: results.every(({ expectations }) => expectations.every(({ status }) => status === 'passed')),
    results,
  };
}
