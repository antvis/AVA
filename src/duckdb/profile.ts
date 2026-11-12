import { z } from 'zod';

import { sqlIdentifier, sqlQualifiedName, sqlStringLiteral } from '../util/sql';
import { resolveMetric, table, column, logicalTypes, TOP_VALUES_OPTIONS } from '../util/profile';

import { kendallPair } from './profile-kendall';
import { cramersPair } from './profile-cramers';
import { chiSquareBins, chiSquareCounts, chiSquareResult, chiSquareSql } from './profile-chi-square';
import { referenceQuantiles } from './profile-quantiles';
import { unicodeSummary } from './profile-unicode';
import { pathSummarySql, urlSummarySql } from './profile-text-parts';
import { autocorrelationResult, autocorrelationSql } from './profile-autocorrelation';
import { timeGapsSql } from './profile-time-gaps';
import {
  characterCountsSql,
  lengthCountsSql,
  referenceMedianLength,
  registerWordLowercase,
  wordCountsSql,
} from './profile-words';

import type { DuckDBConnection } from '@duckdb/node-api';
import type { MetricField } from '../util/profile';
import type { Metric, Schema, ParsedProfileOptions, LogicalType, MetricId, Profile } from '../types';

/** Map a database type to a profile type. */
export function logicalType(nativeType: string): LogicalType {
  if (/\[[^\]]*\]$/.test(nativeType)) return 'unknown';
  if (
    /^(U?(TINYINT|SMALLINT|INTEGER|BIGINT|HUGEINT)|INT[1248]?|FLOAT|DOUBLE|REAL|DECIMAL(?:\(.*\))?|NUMERIC(?:\(.*\))?|BIGNUM)$/i.test(
      nativeType
    )
  )
    return 'numeric';
  if (/^(VARCHAR|CHAR|BPCHAR|TEXT|STRING|UUID|ENUM\(.*\))$/i.test(nativeType)) return 'string';
  if (/^BOOLEAN$/i.test(nativeType)) return 'boolean';
  if (/^(DATE|TIMESTAMP(?:_S|_MS|_NS|TZ| WITH TIME ZONE)?)$/i.test(nativeType)) return 'date';
  return 'unknown';
}

interface ExpressionContext {
  readonly table: string;
  readonly column?: string;
  readonly rawColumn?: string;
  readonly field?: MetricField;
  readonly fields?: MetricField[];
  readonly sourceAlias?: string;
  readonly nanAsNull?: boolean;
  readonly center?: string;
  readonly histogram?: { edges: string; limits: string };
  readonly chiSquare?: { lo: string; hi: string; bins: string };
  readonly monotonic?: string;
  readonly wordLowercase?: string;
  readonly metric: ParsedProfileOptions['metrics'][number];
}

export type DuckDBMetricExpression = (context: ExpressionContext) => string;
export type DuckDBMetric = Metric<DuckDBMetricExpression>;

type ColumnContext = Pick<ExpressionContext, 'column' | 'field' | 'rawColumn'>;

const floatingPoint = /^(FLOAT|DOUBLE|REAL)$/i;

function withoutNaN(column: string): string {
  return `(CASE WHEN NOT isnan(${column}) THEN ${column} END)`;
}

function profileValue(field: MetricField, sourceAlias?: string, nanAsNull?: boolean): string {
  const column = sqlQualifiedName(field.name, sourceAlias);
  return nanAsNull && floatingPoint.test(field.type) ? withoutNaN(column) : column;
}

function monotonicity(column: string, previous: string): string {
  const compare = (op: string) => `coalesce(bool_and(${column} ${op} ${previous}), true)`;
  const increasing = compare('>=');
  const decreasing = compare('<=');
  const strictlyIncreasing = compare('>');
  const strictlyDecreasing = compare('<');
  return `struct_pack(increasing := ${increasing}, decreasing := ${decreasing},
    strictly_increasing := ${strictlyIncreasing}, strictly_decreasing := ${strictlyDecreasing},
    direction := CASE WHEN ${strictlyIncreasing} THEN 2 WHEN ${strictlyDecreasing} THEN -2
      WHEN ${increasing} THEN 1 WHEN ${decreasing} THEN -1 ELSE 0 END)`;
}

function finiteFilter({ column, field }: ColumnContext): string {
  return field && (field.logicalType === 'date' || floatingPoint.test(field.type))
    ? ` FILTER (WHERE isfinite(${column}))`
    : '';
}

/** Build an aggregate for valid values. */
function aggregate(fn: string, context: ColumnContext, argument?: string): string {
  if (!context.field) throw new Error(`${fn} requires a column`);
  return `${fn}(${context.column}${argument === undefined ? '' : `, ${argument}`})${finiteFilter(context)}`;
}

function withInfinity(fn: string, context: ColumnContext): string {
  return context.rawColumn ? `${fn}(${context.column})` : aggregate(fn, context);
}

function range(fn: string, context: ExpressionContext): string {
  const expression = withInfinity(fn, context);
  return context.field?.logicalType === 'date' ? `epoch_ms(${expression})` : expression;
}

function onlyFiniteSample(context: ColumnContext, sql: string): string {
  return context.rawColumn ? `CASE WHEN count(*) FILTER (WHERE isinf(${context.column})) = 0 THEN ${sql} END` : sql;
}

function numericCondition(id: string, { column, field, rawColumn }: ExpressionContext): string {
  if (id === 'zero') return `${column} = 0`;
  if (id === 'negative') return `${column} < 0`;
  if (!floatingPoint.test(field!.type)) return id === 'finite' ? `${column} IS NOT NULL` : 'FALSE';
  if (id === 'nan') return `isnan(${rawColumn ?? column})`;
  return `${id === 'infinite' ? 'isinf' : 'isfinite'}(${column})`;
}

function frequencyHistogram({ column, field, rawColumn }: ColumnContext): string {
  // NaN is unordered in DuckDB's histogram map and must be counted separately.
  return `histogram(${column})${
    !rawColumn && field && floatingPoint.test(field.type) ? ` FILTER (WHERE NOT isnan(${column}))` : ''
  }`;
}

function singletons(context: ColumnContext): string {
  const count = `COALESCE(list_count(list_filter(map_values(${frequencyHistogram(context)}), n -> n = 1)), 0)`;
  return !context.rawColumn && context.field && floatingPoint.test(context.field.type)
    ? `(${count} + (COUNT(*) FILTER (WHERE isnan(${context.column})) = 1)::BIGINT)`
    : count;
}

function frequencyRanks(context: ColumnContext): string {
  let entries = `map_entries(${frequencyHistogram(context)})`;
  if (!context.rawColumn && context.field && floatingPoint.test(context.field.type)) {
    const nanCount = `COUNT(*) FILTER (WHERE isnan(${context.column}))`;
    entries = `list_concat(${entries}, CASE WHEN ${nanCount} > 0
      THEN [struct_pack(key := 'NaN'::DOUBLE, value := (${nanCount})::UBIGINT)] ELSE [] END)`;
  }
  return `list_transform(${entries}, lambda entry: struct_pack(
    rank := -struct_extract(entry, 'value')::HUGEINT, value := struct_extract(entry, 'key')))`;
}

function frequencyValue(value: string, field?: MetricField): string {
  return field?.logicalType === 'date' ? `CAST(${value} AS VARCHAR)` : value;
}

function imbalance(context: ColumnContext): string {
  const counts = `map_values(${frequencyHistogram(context)})`;
  const classes = `list_count(${counts})`;
  const total = `list_sum(${counts})::DOUBLE`;
  const weightedLogs = `list_sum(list_transform(${counts}, lambda n: n * log2(n)))`;
  // Entropy = log2(total) - sum(count * log2(count)) / total.
  return `CASE WHEN ${classes} > 1 THEN greatest(0, least(1,
    1 - (log2(${total}) - ${weightedLogs} / ${total}) / log2(${classes}))) ELSE 0 END`;
}

function tableSummary({ fields = [], sourceAlias, nanAsNull }: ExpressionContext): string {
  const counts = fields.map((field) => `COUNT(${profileValue(field, sourceAlias, nanAsNull)})`);
  const sum = (items: string[]) => (items.length ? `COALESCE(list_sum([${items.join(', ')}]), 0)::DOUBLE` : '0');
  const missing = sum(counts.map((count) => `COUNT(*) - ${count}`));
  const withNulls = sum(counts.map((count) => `(COUNT(*) > ${count})::INTEGER`));
  const allNull = sum(counts.map((count) => `(COUNT(*) > 0 AND ${count} = 0)::INTEGER`));
  const types = ['numeric', 'string', 'boolean', 'date', 'unknown'].map((type) => {
    const count = nanAsNull
      ? sum(
          fields.map(({ logicalType }, i) => {
            if (type === 'unknown') return logicalType === 'unknown' ? '1' : `(${counts[i]} = 0)::INTEGER`;
            return logicalType === type ? `(${counts[i]} > 0)::INTEGER` : '0';
          })
        )
      : String(fields.filter(({ logicalType }) => logicalType === type).length);
    return `${sqlIdentifier(type)} := ${count}`;
  });
  return `struct_pack(row_count := COUNT(*)::DOUBLE, column_count := ${fields.length},
    null_cell_count := ${missing}, null_cell_ratio := COALESCE(${missing} / NULLIF(COUNT(*)::DOUBLE * ${
    fields.length
  }, 0), 0),
    columns_with_nulls := ${withNulls}, all_null_columns := ${allNull}, type_counts := struct_pack(${types.join(
    ', '
  )}))`;
}

const columnNamesOption = {
  validate(value: unknown): void {
    z.array(z.string().min(1))
      .nonempty()
      .refine((names) => new Set(names).size === names.length)
      .parse(value);
  },
};

const orderByOption = {
  validate(value: unknown): void {
    z.string().min(1).parse(value);
  },
};

function orderField({ fields, metric }: ExpressionContext): MetricField | undefined {
  if (metric.orderBy === undefined) return undefined;
  const field = fields?.find(({ name }) => name === metric.orderBy);
  if (!field) throw new Error(`Unknown ${metric.id} order column: ${metric.orderBy}`);
  return field;
}

function selectFields({ fields = [], metric }: ExpressionContext): MetricField[] {
  if (metric.columns === undefined) return fields;
  const known = new Map(fields.map((field) => [field.name, field]));
  return (metric.columns as string[]).map((name) => {
    const field = known.get(name);
    if (!field) throw new Error(`Unknown ${metric.id} column: ${name}`);
    return field;
  });
}

function rowStruct(fields: MetricField[], { sourceAlias, nanAsNull }: ExpressionContext): string {
  return `struct_pack(${fields
    .map((field) => `${sqlIdentifier(field.name)} := ${profileValue(field, sourceAlias, nanAsNull)}`)
    .join(', ')})`;
}

function duplicateRows(context: ExpressionContext): string {
  const { table, metric } = context;
  const { limit = 10 } = metric;
  const fields = selectFields(context);
  const empty =
    'struct_pack(group_count := 0, group_ratio := 0, duplicate_row_count := 0, excess_row_count := 0, samples := [])';
  if (!fields.length) return `COALESCE(first(NULL), ${empty})`;

  const key = rowStruct(fields, context);
  const duplicates = 'COUNT(*) FILTER (WHERE n > 1)';
  const samples =
    limit === 0
      ? '[]'
      : `COALESCE(arg_min(struct_pack(row_values := row_key, count := n::DOUBLE),
    struct_pack(rank := -n, row_key := row_key), ${limit}) FILTER (WHERE n > 1), [])`;
  // The group counts stay inside DuckDB and arg_min retains only the requested sample rows.
  return `COALESCE(first((SELECT struct_pack(group_count := (${duplicates})::DOUBLE,
    group_ratio := COALESCE((${duplicates})::DOUBLE / NULLIF(sum(n), 0), 0),
    duplicate_row_count := COALESCE(sum(n) FILTER (WHERE n > 1), 0)::DOUBLE,
    excess_row_count := COALESCE(sum(n - 1), 0)::DOUBLE, samples := ${samples})
    FROM (SELECT ${key} AS row_key, COUNT(*) AS n FROM ${table} GROUP BY 1) grouped)), ${empty})`;
}

function rowSample(context: ExpressionContext): string {
  const { table, metric } = context;
  const { head = 10, tail = 10, random = 0, seed } = metric;
  const fields = selectFields(context);
  const empty = 'struct_pack(head := [], tail := [], random := [])';
  if (!fields.length || (head === 0 && tail === 0 && random === 0)) return `COALESCE(first(NULL), ${empty})`;

  const rows = `SELECT row_number() OVER () - 1 AS position, ${rowStruct(fields, context)} AS row_values FROM ${table}`;
  const row = 'struct_pack(index := position::DOUBLE, row_values := row_values)';
  const headRows = head === 0 ? '[]' : `COALESCE(arg_min(${row}, position, ${head}), [])`;
  const tailRows = tail === 0 ? '[]' : `COALESCE(list_reverse(arg_max(${row}, position, ${tail})), [])`;
  const randomKey = seed === undefined ? 'random()' : `hash(position, ${seed})`;
  const randomRows =
    random === 0
      ? '[]'
      : `CASE WHEN count(*) BETWEEN 1 AND ${random} - 1
    THEN error('Cannot sample more rows than the source without replacement')
    ELSE COALESCE(arg_min(${row}, ${randomKey}, ${random}), []) END`;
  return `COALESCE(first((SELECT struct_pack(head := ${headRows}, tail := ${tailRows}, random := ${randomRows})
    FROM (${rows}) ordered_rows)), ${empty})`;
}

function numericCorrelationFields(context: ExpressionContext): MetricField[] {
  const fields = selectFields(context).filter(({ logicalType }) => logicalType === 'numeric');
  if (context.metric.columns && fields.length !== (context.metric.columns as string[]).length) {
    const method = context.metric.id;
    throw new Error(`${method[0].toUpperCase()}${method.slice(1)} correlation requires numeric columns`);
  }
  return fields;
}

const emptyCorrelation = 'struct_pack(columns := []::VARCHAR[], matrix := COALESCE(first(NULL), []::DOUBLE[][]))';

function correlationMatrix(fields: MetricField[], coefficient: (i: number, j: number) => string): string {
  const columns = fields.map(({ name }) => sqlStringLiteral(name));
  const rows = fields.map(
    (_, i) => `[${fields.map((_, j) => coefficient(Math.min(i, j), Math.max(i, j))).join(', ')}]`
  );
  return `struct_pack(columns := [${columns.join(', ')}], matrix := list_transform([${rows.join(', ')}],
    lambda r: list_transform(r, lambda v: CASE WHEN isfinite(v) THEN greatest(-1, least(1, v)) END)))`;
}

function filterCorrelation(matrix: string, flags: string): string {
  return `list_transform([struct_pack(result := ${matrix}, flags := ${flags})], lambda item:
    CASE WHEN list_count(list_filter(item.flags, lambda included: included)) >= 2 THEN
      struct_pack(columns := list_filter(item.result.columns, lambda c, i: item.flags[i]),
        matrix := list_transform(list_filter(item.result.matrix, lambda r, i: item.flags[i]),
          lambda r: list_filter(r, lambda v, j: item.flags[j]))) END)[1]`;
}

function missingMask(field: MetricField, sourceAlias?: string): string {
  const column = sqlQualifiedName(field.name, sourceAlias);
  return floatingPoint.test(field.type) ? `(${column} IS NULL OR isnan(${column}))` : `(${column} IS NULL)`;
}

function missingCorrelation(context: ExpressionContext): string {
  const fields = selectFields(context);
  if (fields.length < 2) return 'first(NULL)';
  const masks = fields.map((field) => missingMask(field, context.sourceAlias));
  const flags = masks.map((mask) => `count(*) FILTER (WHERE ${mask}) BETWEEN 1 AND count(*) - 1`);
  const matrix = correlationMatrix(fields, (i, j) =>
    i === j ? '1::DOUBLE' : `corr(${masks[i]}::DOUBLE, ${masks[j]}::DOUBLE)`
  );
  return filterCorrelation(matrix, `[${flags.join(', ')}]`);
}

function pearson(context: ExpressionContext): string {
  const fields = numericCorrelationFields(context);
  if (!fields.length) return emptyCorrelation;
  const values = fields.map(({ name }) => `TRY_CAST(${sqlQualifiedName(name, context.sourceAlias)} AS DOUBLE)`);
  return correlationMatrix(fields, (i, j) => {
    const left = values[i];
    const right = values[j];
    if (i === j) {
      const finite = `FILTER (WHERE isfinite(${left}))`;
      return `CASE WHEN min(${left}) ${finite} < max(${left}) ${finite} THEN 1::DOUBLE END`;
    }
    return `corr(${left}, ${right}) FILTER (WHERE isfinite(${left}) AND isfinite(${right}))`;
  });
}

function spearmanPair(input: string, left: string, right: string, active = 'TRUE'): string {
  // Average ties over the observations shared by this pair.
  const rank = (column: string) => `rank() OVER (ORDER BY ${column}) +
    (count(*) OVER (ORDER BY ${column} RANGE BETWEEN CURRENT ROW AND CURRENT ROW) - 1) / 2.0`;
  return `SELECT corr(rank_left, rank_right) FROM (
    SELECT ${rank(left)} AS rank_left, ${rank(right)} AS rank_right
    FROM ${input} WHERE isfinite(${left}) AND isfinite(${right}) AND ${active}
  ) ranks`;
}

function rankCorrelation(context: ExpressionContext): string {
  const fields = numericCorrelationFields(context);
  if (!fields.length) return emptyCorrelation;
  const input = context.table.toLowerCase().startsWith('"__ava_rank_rows"') ? '__ava_rank_rows_2' : '__ava_rank_rows';
  const projection = fields.map(
    ({ name }, i) => `TRY_CAST(${sqlQualifiedName(name, context.sourceAlias)} AS DOUBLE) AS c${i}`
  );
  const pairs: string[] = [];
  const kendall = context.metric.id === 'kendall';
  for (let i = 0; i < fields.length; i += 1) {
    for (let j = i; j < fields.length; j += 1) {
      const left = `c${i}`;
      const right = `c${j}`;
      let query: string;
      if (i === j) {
        const defined = kendall ? 'count(*) > 0' : `min(${left}) < max(${left})`;
        query = `SELECT CASE WHEN ${defined} THEN 1::DOUBLE END FROM ${input} WHERE isfinite(${left})`;
      } else if (kendall) {
        query = kendallPair(input, left, right);
      } else {
        query = spearmanPair(input, left, right);
      }
      pairs.push(`(${query}) AS p${i}_${j}`);
    }
  }
  const matrix = correlationMatrix(fields, (i, j) => `p${i}_${j}`);
  const empty = correlationMatrix(fields, () => 'NULL::DOUBLE');
  return `COALESCE(first((WITH ${input} AS MATERIALIZED (SELECT ${projection.join(', ')} FROM ${context.table})
    SELECT ${matrix} FROM (SELECT ${pairs.join(', ')}) coefficients)), ${empty})`;
}

function categoryCorrelation(context: ExpressionContext): string {
  const { columns, maxCategories = 100, bins = 10 } = context.metric;
  const automatic = context.metric.id === 'auto';
  const fields = selectFields(context).filter(
    ({ logicalType }) =>
      logicalType === 'string' ||
      logicalType === 'boolean' ||
      ((automatic || columns !== undefined) && logicalType === 'numeric')
  );
  if (columns && fields.length !== (columns as string[]).length) {
    throw new Error(
      `${automatic ? 'Automatic correlation' : "Cramér's V"} requires text, boolean or numeric category columns`
    );
  }
  if (fields.length < 2) return 'first(NULL)';

  const input = context.table.toLowerCase().startsWith('"__ava_category_rows"')
    ? '__ava_category_rows_2'
    : '__ava_category_rows';
  const projection = fields.map(({ name, type }, i) => {
    const value = sqlQualifiedName(name, context.sourceAlias);
    const category = floatingPoint.test(type) ? withoutNaN(value) : value;
    return `${category} AS c${i}`;
  });
  const numeric = fields.map(({ logicalType }) => automatic && logicalType === 'numeric');
  const mixed = numeric.some(Boolean) && !numeric.every(Boolean);
  const eligibility = fields.map((_, i) =>
    numeric[i] ? `count(DISTINCT c${i}) > 1` : `count(DISTINCT c${i}) BETWEEN 2 AND ${maxCategories}`
  );
  const bounds: string[] = [];
  const buckets: string[] = [];
  for (let i = 0; i < fields.length; i += 1) {
    if (!numeric[i] || !mixed) continue;
    const value = `c${i}::DOUBLE`;
    bounds.push(`min(${value}) FILTER (WHERE isfinite(${value})) AS lo${i},
      max(${value}) FILTER (WHERE isfinite(${value})) AS hi${i}`);
    const span = `(hi${i} - lo${i})`;
    const edge = (offset: string) => `(lo${i} + ${span} / ${bins} * (${offset}))`;
    // pandas.cut uses right-closed bins. The minimum belongs to the first bin.
    buckets.push(`CASE WHEN ${value} IS NULL OR NOT isfinite(${value}) THEN NULL WHEN ${span} = 0 THEN 0
      ELSE list_transform([least(${bins} - 1, trunc((${value} - lo${i}) / ${span} * ${bins})::BIGINT)], lambda bucket:
        bucket + CASE WHEN bucket > 0 AND ${value} <= ${edge('bucket')} THEN -1
          WHEN bucket < ${bins} - 1 AND ${value} > ${edge('bucket + 1')} THEN 1 ELSE 0 END)[1] END AS b${i}`);
  }
  const binned = `${input}_binned`;
  const bin = (i: number) => `${mixed && numeric[i] ? 'b' : 'c'}${i}`;
  const checks = numeric.flatMap((yes, i) => (yes ? [`count(*) FILTER (WHERE isinf(c${i}::DOUBLE)) = 0`] : []));
  const supported = checks.length ? checks.join(' AND ') : 'TRUE';
  const pairs: string[] = [];
  for (let i = 0; i < fields.length; i += 1) {
    for (let j = i + 1; j < fields.length; j += 1) {
      const active = `(SELECT supported AND flags[${i + 1}] AND flags[${j + 1}] FROM eligibility)`;
      const pair =
        numeric[i] && numeric[j]
          ? spearmanPair(input, `c${i}::DOUBLE`, `c${j}::DOUBLE`, active)
          : cramersPair(mixed ? binned : input, bin(i), bin(j), active, automatic);
      pairs.push(`(${pair}) AS p${i}_${j}`);
    }
  }
  const matrix = correlationMatrix(fields, (i, j) => (i === j ? '1::DOUBLE' : `p${i}_${j}`));
  return `first((WITH ${input} AS MATERIALIZED (SELECT ${projection.join(', ')} FROM ${context.table}),
    eligibility AS (SELECT [${eligibility.join(', ')}] AS flags, ${supported} AS supported
      ${bounds.length ? `, ${bounds.join(', ')}` : ''} FROM ${input}),
    ${
      mixed
        ? `${binned} AS MATERIALIZED (SELECT ${input}.*, ${buckets.join(', ')} FROM ${input} CROSS JOIN eligibility),`
        : ''
    }
    coefficients AS (SELECT flags, supported, ${pairs.join(', ')} FROM eligibility)
    SELECT CASE WHEN supported THEN ${filterCorrelation(matrix, 'flags')} END FROM coefficients))`;
}

const shapeMetrics = ['skewness', 'kurtosis'] as const;

function shape(metric: (typeof shapeMetrics)[number], context: ExpressionContext): string {
  const count = `(${aggregate('count', context)})::DOUBLE`;
  const delta = `(${context.column}::DOUBLE - ${context.center})`;
  const centralSum = (power: number) => `fsum(pow(${delta}, ${power}))${finiteFilter(context)}`;
  const second = centralSum(2);
  // Match pandas' sample corrections and round-off threshold for near-zero moments.
  const zeroSmall = (value: string) => `(CASE WHEN abs(${value}) < 1e-14 THEN 0 ELSE ${value} END)`;
  if (metric === 'skewness') {
    return `CASE WHEN ${count} < 3 THEN NULL WHEN abs(${second}) < 1e-14 THEN 0
      ELSE ${count} * sqrt(${count} - 1) / (${count} - 2) * ${zeroSmall(centralSum(3))} / pow(${second}, 1.5) END`;
  }
  const correction = `(${count} - 2) * (${count} - 3)`;
  const denominator = `(${correction} * pow(${second}, 2))`;
  const numerator = `${count} * (${count} + 1) * (${count} - 1) * (${centralSum(4)})`;
  return `CASE WHEN ${count} < 4 THEN NULL WHEN abs(${denominator}) < 1e-14 THEN 0
    ELSE ${zeroSmall(numerator)} / ${denominator} - 3 * pow(${count} - 1, 2) / (${correction}) END`;
}

function histogramValue({ column, field }: ColumnContext): string {
  return field?.logicalType === 'date' ? `epoch_ms(${column})::DOUBLE` : `TRY_CAST(${column} AS DOUBLE)`;
}

function chiSquareValue(context: ColumnContext): string {
  const value = histogramValue(context);
  return context.field?.logicalType === 'date' ? `floor(${value} / 1000.0)` : value;
}

function histogramEdges(lo: string, hi: string, bins: string): string {
  const span = `(${hi} - ${lo})`;
  const fraction = `(i::DOUBLE / ${bins})`;
  const padding = `(CASE WHEN ${lo} = 0 THEN 0.5 ELSE greatest(5e-324, abs(${lo}) * 0.1) END)`;
  return `CASE WHEN ${lo} IS NULL THEN []::DOUBLE[]
    WHEN ${lo} = ${hi} THEN [greatest(-1.7976931348623157e308, ${lo} - ${padding}),
      least(1.7976931348623157e308, ${hi} + ${padding})]
    ELSE list_sort(list_distinct(list_transform(range(${bins} + 1), lambda i: CASE WHEN i = ${bins} THEN ${hi}
      WHEN isfinite(${span}) THEN ${lo} + (${span} / ${bins}) * i
      ELSE ${lo} * (1 - ${fraction}) + ${hi} * ${fraction} END))) END`;
}

function histogramExpression(context: ExpressionContext): string {
  const { edges, limits } = context.histogram!;
  const value = histogramValue(context);
  const counts = `map_values(histogram(${value}, ${limits}) FILTER (WHERE isfinite(${value})))`;
  const summary = `struct_pack(bin_edges := COALESCE(first(${edges}), []),
    counts := COALESCE(list_transform(${counts}, lambda n: n::DOUBLE), []))`;
  if (!context.metric.density) return summary;
  return `list_transform([${summary}], lambda h: struct_pack(bin_edges := h.bin_edges,
    counts := list_transform(h.counts, lambda n, i: n /
      NULLIF(list_sum(h.counts) * (h.bin_edges[i + 1] - h.bin_edges[i]), 0))))[1]`;
}

export const BUILTIN_METRICS: DuckDBMetric[] = [
  { id: 'row_count', enable: table, expression: () => 'COUNT(*)' },
  { id: 'table_summary', enable: table, expression: tableSummary },
  {
    id: 'row_sample',
    enable: table,
    options: {
      columns: columnNamesOption,
      ...Object.fromEntries(
        ['head', 'tail', 'random'].map((name) => [
          name,
          {
            validate: (value: unknown) => {
              z.number().int().nonnegative().parse(value);
            },
          },
        ])
      ),
      seed: {
        validate: (value) => {
          z.number().int().parse(value);
        },
      },
    },
    expression: rowSample,
  },
  {
    id: 'row_duplicates',
    enable: table,
    options: {
      limit: {
        validate: (value) => {
          z.number().int().nonnegative().parse(value);
        },
      },
      columns: columnNamesOption,
    },
    expression: duplicateRows,
  },
  { id: 'pearson', enable: table, options: { columns: columnNamesOption }, expression: pearson },
  { id: 'spearman', enable: table, options: { columns: columnNamesOption }, expression: rankCorrelation },
  { id: 'kendall', enable: table, options: { columns: columnNamesOption }, expression: rankCorrelation },
  { id: 'missing_correlation', enable: table, options: { columns: columnNamesOption }, expression: missingCorrelation },
  ...['cramers', 'auto'].map(
    (id): DuckDBMetric => ({
      id,
      enable: table,
      options: {
        columns: columnNamesOption,
        maxCategories: {
          validate: (value) => {
            z.number().int().nonnegative().parse(value);
          },
        },
        ...(id === 'auto'
          ? {
              bins: {
                validate: (value: unknown) => {
                  z.number().int().positive().parse(value);
                },
              },
            }
          : {}),
      },
      expression: categoryCorrelation,
    })
  ),
  { id: 'valid_count', enable: column, expression: ({ column }) => `COUNT(${column})` },
  { id: 'null_count', enable: column, expression: ({ column }) => `COUNT(*) - COUNT(${column})` },
  {
    id: 'null_ratio',
    enable: column,
    expression: ({ column }) => `COALESCE((COUNT(*) - COUNT(${column}))::DOUBLE / NULLIF(COUNT(*), 0), 0)`,
  },
  {
    id: 'distinct_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COUNT(DISTINCT ${column})`,
  },
  {
    id: 'distinct_ratio',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COALESCE(COUNT(DISTINCT ${column})::DOUBLE / NULLIF(COUNT(${column}), 0), 0)`,
  },
  {
    id: 'unique_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: singletons,
  },
  {
    id: 'unique_ratio',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: (context) => `COALESCE(${singletons(context)}::DOUBLE / NULLIF(COUNT(${context.column}), 0), 0)`,
  },
  {
    id: 'is_unique',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: ({ column }) => `COUNT(${column}) > 0 AND COUNT(DISTINCT ${column}) = COUNT(${column})`,
  },
  {
    id: 'top_values',
    enable: logicalTypes('string', 'boolean'),
    options: TOP_VALUES_OPTIONS,
    expression: ({ table, column, metric }) => {
      const { limit = 3, maxDistinctRatio = 0.5 } = metric;
      return `CASE WHEN COUNT(DISTINCT ${column}) > COUNT(*) * ${maxDistinctRatio}
      THEN NULL ELSE COALESCE(first((SELECT list(struct_pack(value := v, count := CAST(n AS DOUBLE)) ORDER BY n DESC, v ASC)
        FROM (SELECT ${column} AS v, COUNT(*) AS n FROM ${table}
          WHERE ${column} IS NOT NULL GROUP BY ${column}
          ORDER BY n DESC, v ASC LIMIT ${limit}) AS ranked)), []) END`;
    },
  },
  {
    id: 'duplicate_count',
    enable: column,
    expression: ({ column }) => `COUNT(${column}) - COUNT(DISTINCT ${column})`,
  },
  {
    id: 'value_counts',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: (context) => `COALESCE(list_transform(list_sort(${frequencyRanks(context)}), lambda entry:
      struct_pack(value := ${frequencyValue("struct_extract(entry, 'value')", context.field)},
        count := -struct_extract(entry, 'rank')::DOUBLE)), [])`,
  },
  {
    id: 'mode',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: (context) =>
      frequencyValue(`struct_extract(list_min(${frequencyRanks(context)}), 'value')`, context.field),
  },
  {
    id: 'mode_count',
    enable: logicalTypes('numeric', 'string', 'boolean', 'date'),
    expression: (context) => `COALESCE(-struct_extract(list_min(${frequencyRanks(context)}), 'rank')::DOUBLE, 0)`,
  },
  { id: 'imbalance', enable: logicalTypes('string', 'boolean', 'numeric'), expression: imbalance },
  {
    id: 'chi_squared',
    enable: logicalTypes('numeric', 'date', 'string'),
    expression: (context) => {
      const bounds = context.chiSquare;
      return bounds
        ? chiSquareSql(chiSquareCounts(chiSquareValue(context), bounds.lo, bounds.hi, bounds.bins), bounds.bins)
        : chiSquareSql(`map_values(${frequencyHistogram(context)})`);
    },
  },
  {
    id: 'monotonicity',
    enable: logicalTypes('numeric'),
    expression: ({ monotonic }) =>
      `COALESCE(first(${monotonic}), struct_pack(increasing := true, decreasing := true,
      strictly_increasing := true, strictly_decreasing := true, direction := 2))`,
  },
  {
    id: 'autocorrelation',
    enable: logicalTypes('numeric'),
    options: {
      lags: {
        validate: (value) => {
          z.number().int().min(0).max(2048).parse(value);
        },
      },
      orderBy: orderByOption,
    },
    expression: (context) => {
      const { table, column, metric, sourceAlias } = context;
      const { lags = 100 } = metric;
      const index = orderField(context);
      return autocorrelationSql(
        table,
        `TRY_CAST(${column} AS DOUBLE)`,
        lags as number,
        index && sqlQualifiedName(index.name, sourceAlias)
      );
    },
  },
  {
    id: 'time_series_gaps',
    enable: logicalTypes('numeric'),
    options: { orderBy: orderByOption },
    expression: (context) => {
      const { table, field, sourceAlias } = context;
      const index = orderField(context);
      let position = 'row_number() OVER () - 1';
      if (index) {
        const column = sqlQualifiedName(index.name, sourceAlias);
        if (index.logicalType === 'date') position = `epoch_ms(${column})`;
        else if (index.logicalType === 'numeric') position = column;
        else throw new Error('time_series_gaps requires a numeric or date order column');
      }
      return timeGapsSql(table, `NOT ${missingMask(field!, sourceAlias)}`, position);
    },
  },
  { id: 'min', enable: logicalTypes('numeric', 'date'), expression: (context) => range('min', context) },
  { id: 'max', enable: logicalTypes('numeric', 'date'), expression: (context) => range('max', context) },
  {
    id: 'min_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `MIN(length(CAST(${column} AS VARCHAR)))`,
  },
  {
    id: 'max_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `MAX(length(CAST(${column} AS VARCHAR)))`,
  },
  {
    id: 'mean_length',
    enable: logicalTypes('string'),
    expression: ({ column }) => `AVG(length(CAST(${column} AS VARCHAR)))`,
  },
  {
    id: 'median_length',
    enable: logicalTypes('string'),
    expression: ({ column, nanAsNull }) =>
      nanAsNull ? lengthCountsSql(column!) : `MEDIAN(length(CAST(${column} AS VARCHAR)))`,
  },
  {
    id: 'length_histogram',
    enable: logicalTypes('string'),
    expression: ({ column }) => lengthCountsSql(column!),
  },
  {
    id: 'word_counts',
    enable: logicalTypes('string'),
    options: {
      stopWords: {
        validate: (value) => {
          z.array(z.string()).parse(value);
        },
      },
      limit: {
        validate: (value) => {
          z.number().int().nonnegative().parse(value);
        },
      },
    },
    expression: ({ table, column, wordLowercase, metric }) =>
      wordCountsSql(
        table,
        column!,
        wordLowercase!,
        (metric.stopWords as string[] | undefined) ?? [],
        metric.limit as number | undefined
      ),
  },
  {
    id: 'character_counts',
    enable: logicalTypes('string'),
    expression: ({ table, column }) => characterCountsSql(table, column!),
  },
  {
    id: 'unicode_summary',
    enable: logicalTypes('string'),
    expression: ({ table, column }) => characterCountsSql(table, column!),
  },
  {
    id: 'url_summary',
    enable: logicalTypes('string'),
    expression: ({ table, column }) => urlSummarySql(table, column!),
  },
  {
    id: 'path_summary',
    enable: logicalTypes('string'),
    expression: ({ table, column }) => pathSummarySql(table, column!),
  },
  { id: 'mean', enable: logicalTypes('numeric'), expression: (context) => withInfinity('avg', context) },
  { id: 'sum', enable: logicalTypes('numeric'), expression: (context) => withInfinity('sum', context) },
  {
    id: 'stddev',
    enable: logicalTypes('numeric'),
    expression: (context) => onlyFiniteSample(context, aggregate('stddev_samp', context)),
  },
  {
    id: 'median',
    enable: logicalTypes('numeric'),
    expression: (context) =>
      context.rawColumn ? `(${referenceQuantiles(context.column!, '[0.5]')})[1].value` : aggregate('median', context),
  },
  {
    id: 'variance',
    enable: logicalTypes('numeric'),
    expression: (context) => onlyFiniteSample(context, aggregate('var_samp', context)),
  },
  ...shapeMetrics.map(
    (id): DuckDBMetric => ({
      id,
      enable: logicalTypes('numeric'),
      expression: (context) => onlyFiniteSample(context, shape(id, context)),
    })
  ),
  {
    id: 'histogram',
    enable: logicalTypes('numeric', 'date'),
    options: {
      bins: {
        validate: (value) => {
          z.number().int().nonnegative().parse(value);
        },
      },
      maxBins: {
        validate: (value) => {
          z.number().int().positive().parse(value);
        },
      },
      density: {
        validate: (value) => {
          z.boolean().parse(value);
        },
      },
    },
    expression: histogramExpression,
  },
  {
    id: 'mad',
    enable: logicalTypes('numeric'),
    expression: (context) =>
      context.rawColumn
        ? `CASE WHEN isfinite(median(${context.column})) THEN mad(${context.column}) END`
        : aggregate('mad', context),
  },
  {
    id: 'iqr',
    enable: logicalTypes('numeric'),
    expression: (context) => {
      if (context.rawColumn) {
        const quartiles = referenceQuantiles(context.column!, '[0.25, 0.75]');
        return `(${quartiles})[2].value - (${quartiles})[1].value`;
      }
      const quartiles = aggregate('quantile_cont', context, '[0.25, 0.75]');
      return `(${quartiles})[2] - (${quartiles})[1]`;
    },
  },
  {
    id: 'cv',
    enable: logicalTypes('numeric'),
    expression: (context) =>
      onlyFiniteSample(context, `${aggregate('stddev_samp', context)} / NULLIF(${aggregate('avg', context)}, 0)`),
  },
  {
    id: 'range',
    enable: logicalTypes('numeric', 'date'),
    expression: (context) => {
      const min = range('min', context);
      const max = range('max', context);
      // TRY accepts scalar expressions, so bind the aggregate bounds before subtracting.
      return `list_transform([struct_pack(lo := ${min}, hi := ${max})], bounds ->
        COALESCE(TRY((bounds.hi - bounds.lo)::DOUBLE), TRY(bounds.hi::DOUBLE - bounds.lo::DOUBLE)))[1]`;
    },
  },
  {
    id: 'quantiles',
    enable: logicalTypes('numeric'),
    options: {
      probabilities: {
        validate: (value) => {
          z.array(z.number().min(0).max(1)).nonempty().parse(value);
        },
      },
    },
    expression: (context) => {
      const probabilities = `[${(
        (context.metric.probabilities as number[] | undefined) ?? [0.05, 0.25, 0.5, 0.75, 0.95]
      ).join(', ')}]`;
      if (context.rawColumn) return referenceQuantiles(context.column!, probabilities);
      return `list_transform(list_zip(${probabilities}::DOUBLE[],
        CAST(${aggregate('quantile_cont', context, probabilities)} AS DOUBLE[])),
        pair -> struct_pack(probability := pair[1], value := pair[2]))`;
    },
  },
  ...['zero', 'negative', 'infinite', 'nan', 'finite'].flatMap((kind): DuckDBMetric[] => [
    {
      id: `${kind}_count`,
      enable: logicalTypes('numeric'),
      expression: (context) => `COUNT(*) FILTER (WHERE ${numericCondition(kind, context)})`,
    },
    {
      id: `${kind}_ratio`,
      enable: logicalTypes('numeric'),
      expression: (context) =>
        `COALESCE((COUNT(*) FILTER (WHERE ${numericCondition(kind, context)}))::DOUBLE / NULLIF(COUNT(*), 0), 0)`,
    },
  ]),
];

export { DEFAULT_METRICS } from '../util/profile';

/** Decode aggregate values into profile metrics. */
function postProcessMetrics(
  row: Record<string, unknown>,
  pending: { alias: string; metricId: MetricId; output: Record<string, unknown> }[],
  referenceSemantics: boolean,
  unicodeProperties?: Parameters<typeof unicodeSummary>[1]
): void {
  for (const { alias, metricId, output } of pending) {
    const raw = row[alias];
    delete output[metricId];
    if (metricId === 'top_values' && raw == null) continue;
    if (metricId === 'chi_squared') {
      output[metricId] = chiSquareResult(raw as Parameters<typeof chiSquareResult>[0]);
    } else if (metricId === 'autocorrelation') {
      output[metricId] = autocorrelationResult(raw as Parameters<typeof autocorrelationResult>[0]);
    } else if (metricId === 'unicode_summary') {
      output[metricId] = unicodeSummary(raw as Parameters<typeof unicodeSummary>[0], unicodeProperties!);
    } else if (metricId === 'median_length' && referenceSemantics) {
      output[metricId] = referenceMedianLength(raw as Parameters<typeof referenceMedianLength>[0]);
    } else if (
      typeof raw === 'object' ||
      typeof raw === 'boolean' ||
      metricId === 'mode' ||
      (referenceSemantics && (raw === 'Infinity' || raw === '-Infinity'))
    ) {
      output[metricId] = raw ?? null;
    } else {
      // Profile numbers use JavaScript precision, including BIGINT and DECIMAL results.
      const number = raw == null ? null : Number(raw);
      output[metricId] = number === null || Number.isFinite(number) ? number : null;
    }
  }
}

/**
 * Compute requested metrics for each model and column.
 */
export async function profileTables(
  connection: DuckDBConnection,
  schema: Schema,
  options: ParsedProfileOptions
): Promise<Profile> {
  const metrics = options.metrics.map((metric) => ({ metric, definition: resolveMetric(metric, BUILTIN_METRICS) }));
  const nanAsNull = options.semantics === 'data-profiling';
  const needsCenters = metrics.some(({ metric }) => metric.id === 'skewness' || metric.id === 'kurtosis');
  const needsMonotonicity = metrics.some(({ metric }) => metric.id === 'monotonicity');
  const needsChiSquare = metrics.some(({ metric }) => metric.id === 'chi_squared');
  const wordLowercase = metrics.some(({ metric }) => metric.id === 'word_counts')
    ? registerWordLowercase(connection)
    : undefined;
  const histogram = metrics.filter(({ metric }) => metric.id === 'histogram').pop()?.metric;
  const unicodeProperties = metrics.some(({ metric }) => metric.id === 'unicode_summary')
    ? (await import('./unicode-properties.json')).default
    : undefined;
  const profiles: Profile['models'] = [];

  for (const table of schema.models) {
    const { name, tableReference } = table;
    const reference = sqlQualifiedName(tableReference.table, tableReference.schema);
    const fields = table.columns.map((field) => ({ ...field, logicalType: logicalType(field.type) }));
    const centerTable = sqlIdentifier(
      tableReference.table.toLowerCase() === '__ava_centers' ? '__ava_centers_2' : '__ava_centers'
    );
    const statistics: string[] = [];
    const axes: string[] = [];
    const windows: string[] = [];
    const usedNames = new Set(fields.map(({ name }) => name.toLowerCase()));
    const addParameter = (expression: string, stage: 'statistic' | 'axis' = 'statistic') => {
      const list = stage === 'statistic' ? statistics : axes;
      const alias = sqlIdentifier(`${stage}${list.length}`);
      list.push(`${expression} AS ${alias}`);
      return alias;
    };
    const parameters = new Map(
      fields.map((field) => {
        const column = sqlIdentifier(field.name);
        const center =
          needsCenters && field.logicalType === 'numeric'
            ? `${centerTable}.${addParameter(aggregate('favg', { column, field }))}`
            : undefined;
        let monotonic: string | undefined;
        if (needsMonotonicity && field.logicalType === 'numeric') {
          let alias = `__ava_previous${windows.length}`;
          while (usedNames.has(alias)) alias += '_';
          const previous = sqlIdentifier(alias);
          const value = floatingPoint.test(field.type) ? withoutNaN(column) : column;
          windows.push(`lag(${value} IGNORE NULLS) OVER () AS ${previous}`);
          monotonic = `${centerTable}.${addParameter(monotonicity(value, previous))}`;
        }
        if (field.logicalType !== 'numeric' && field.logicalType !== 'date') return [field.name, { center, monotonic }];

        let chiSquare: ExpressionContext['chiSquare'];
        if (needsChiSquare) {
          const value = chiSquareValue({ column, field });
          const finite = `FILTER (WHERE isfinite(${value}))`;
          const lo = addParameter(`min(${value}) ${finite}`);
          const hi = addParameter(`max(${value}) ${finite}`);
          const count = addParameter(`count(${value}) ${finite}`);
          const quartiles = addParameter(`quantile_cont(${value}, [0.25, 0.75]) ${finite}`);
          const integral = field.logicalType === 'date' || /INT/i.test(field.type);
          const bins = addParameter(chiSquareBins(lo, hi, count, quartiles, integral), 'axis');
          chiSquare = { lo: `${centerTable}.${lo}`, hi: `${centerTable}.${hi}`, bins: `${centerTable}.${bins}` };
        }
        if (!histogram) return [field.name, { center, monotonic, chiSquare }];

        const value = histogramValue({ column, field });
        const finite = `FILTER (WHERE isfinite(${value}))`;
        const lo = addParameter(`min(${value}) ${finite}`);
        const hi = addParameter(`max(${value}) ${finite}`);
        const { bins = 50, maxBins = 250 } = histogram;
        let requested: string;
        if (bins === 0) {
          // Numeric bin selection uses distinct observations, as in the reference profile.
          const input = field.logicalType === 'numeric' ? `DISTINCT ${value}` : value;
          const count = addParameter(`count(${input}) ${finite}`);
          const quartiles = addParameter(`quantile_cont(${input}, [0.25, 0.75]) ${finite}`);
          const iqr = `(${quartiles}[2] - ${quartiles}[1])`;
          const sturges = `(log2(NULLIF(${count}, 0)) + 1)`;
          const fd = `((${hi} - ${lo}) * cbrt(${count}) / NULLIF(2 * ${iqr}, 0))`;
          requested = `ceil(greatest(${sturges}, ${fd}))`;
        } else {
          const distinct = addParameter(`count(DISTINCT ${value}) FILTER (WHERE NOT isnan(${value}))`);
          requested = `least(${bins}, ${distinct})`;
        }
        const count = `greatest(1, least(${maxBins}, ${requested}))::BIGINT`;
        const edges = addParameter(histogramEdges(lo, hi, count), 'axis');
        // DuckDB's buckets are right-closed. Shift interior limits to count NumPy's left-closed buckets.
        const limits = addParameter(
          `list_transform(list_slice(${edges}, 2, -1), lambda edge, i:
        CASE WHEN i = len(${edges}) - 1 THEN edge ELSE nextafter(edge, '-Infinity'::DOUBLE) END)`,
          'axis'
        );
        return [
          field.name,
          {
            center,
            monotonic,
            chiSquare,
            histogram: { edges: `${centerTable}.${edges}`, limits: `${centerTable}.${limits}` },
          },
        ];
      })
    );
    const sourceAlias = statistics.length ? '__ava_source' : undefined;
    const source = sourceAlias ? `${reference} AS ${sqlIdentifier(sourceAlias)}` : reference;
    const profile: Profile['models'][number] = {
      name,
      metrics: {},
      columns: [],
    };
    profiles.push(profile);

    const pending: Array<{ alias: string; metricId: MetricId; output: Record<string, unknown> }> = [];
    const expressions = new Map<string, string>();

    const addMetrics = (output: Record<string, unknown>, field?: MetricField) => {
      const raw = field ? sqlQualifiedName(field.name, sourceAlias) : undefined;
      const column = field ? profileValue(field, sourceAlias, nanAsNull) : undefined;
      for (const { metric, definition } of metrics) {
        const target = field ? 'column' : 'table';
        if (!definition.enable({ target, field }) || (metric.id === 'histogram' && metric !== histogram)) {
          continue;
        }

        const expression = definition.expression({
          table: source,
          column,
          rawColumn: column === raw ? undefined : raw,
          ...(field && parameters.get(field.name)),
          field,
          fields,
          sourceAlias,
          nanAsNull,
          wordLowercase,
          metric,
        });
        const alias = expressions.get(expression) ?? `m${expressions.size}`;
        expressions.set(expression, alias);
        pending.push({ alias, metricId: metric.id, output });
      }
    };

    addMetrics(profile.metrics);
    profile.columns = fields.map((field) => {
      const metrics = {};
      addMetrics(metrics, field);
      return { name: field.name, properties: { logicalType: field.logicalType }, metrics };
    });

    const presence = nanAsNull
      ? fields.map(
          (field, i) => `count(${profileValue(field, sourceAlias, true)}) > 0 AS ${sqlIdentifier(`has_value${i}`)}`
        )
      : [];
    if (!pending.length && !presence.length) continue;

    // Ordered comparisons, bin edges and moment centers share the same preliminary scan.
    const parameterSource = windows.length ? `(SELECT *, ${windows.join(', ')} FROM ${reference})` : reference;
    const preliminary = `SELECT ${statistics.join(', ')} FROM ${parameterSource}`;
    const withParameters = statistics.length
      ? `WITH ${centerTable} AS (${
          axes.length ? `SELECT *, ${axes.join(', ')} FROM (${preliminary}) bounds` : preliminary
        }) `
      : '';
    const projection = [...expressions].map(([expression, alias]) => `${expression} AS ${sqlIdentifier(alias)}`);
    const sql = `${withParameters}SELECT ${projection.concat(presence).join(', ')}
      FROM ${source}${statistics.length ? ` CROSS JOIN ${centerTable}` : ''}`;
    const row = (await connection.runAndReadAll(sql)).getRowObjectsJson()[0];
    postProcessMetrics(row, pending, nanAsNull, unicodeProperties);
    if (nanAsNull) {
      for (const [i, column] of profile.columns.entries()) {
        if (!row[`has_value${i}`]) column.properties.logicalType = 'unknown';
      }
    }
  }

  return options.semantics ? { models: profiles, semantics: options.semantics } : { models: profiles };
}
