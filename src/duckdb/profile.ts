import { isAbsolute } from 'node:path';

import { z } from 'zod';

import { sqlIdentifier, sqlQualifiedName, sqlStringLiteral } from '../util/sql';
import { jsonValue } from '../contracts/shared/json';
import { resolveMetric, table, column, logicalTypes, TOP_VALUES_OPTIONS } from '../util/profile';

import { kendallPair } from './profile-kendall';
import { cramersPair, phiKPair } from './profile-cramers';
import { phiKMatrix } from './profile-phik';
import { chiSquareBins, chiSquareCounts, chiSquareResult, chiSquareSql } from './profile-chi-square';
import { referenceQuantiles } from './profile-quantiles';
import { unicodeSummary } from './profile-unicode';
import { pathSummarySql, urlSummarySql } from './profile-text-parts';
import { autocorrelationResult, autocorrelationSql } from './profile-autocorrelation';
import { timeGapsSql } from './profile-time-gaps';
import { dateValidationSql, parseDateSql } from './profile-dates';
import { frequencySpectrum } from './profile-spectrum';
import { augmentedDickeyFuller } from './profile-adf';
import { booleanSql, inferColumnTypes, numericTextSql } from './profile-inference';
import { fileSummary } from './profile-files';
import { imageSummary } from './profile-images';
import { scatterPairSql } from './profile-scatter';
import {
  characterCountsSql,
  lengthCountsSql,
  referenceMedianLength,
  registerWordLowercase,
  wordCountsSql,
} from './profile-words';

import type { DuckDBConnection } from '@duckdb/node-api';
import type { MetricField } from '../util/profile';
import type { Metric, Schema, ParsedProfileOptions, LogicalType, Profile, ProfileType } from '../types';

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

type ProfileField = MetricField & {
  profileType?: ProfileType;
  sourceType?: string;
  booleanValues?: { mappings?: Record<string, boolean>; lowercase?: string };
};

const logicalProfileTypes: Record<ProfileType, LogicalType> = {
  Numeric: 'numeric',
  Categorical: 'string',
  Text: 'string',
  Boolean: 'boolean',
  DateTime: 'date',
  TimeSeries: 'numeric',
  URL: 'string',
  Path: 'string',
  File: 'string',
  Image: 'string',
  Unsupported: 'unknown',
};

interface ExpressionContext {
  readonly table: string;
  readonly column?: string;
  readonly rawColumn?: string;
  readonly field?: ProfileField;
  readonly fields?: ProfileField[];
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

function profileValue(field: ProfileField, sourceAlias?: string, nanAsNull?: boolean, raw = false): string {
  let column = sqlQualifiedName(field.name, sourceAlias);
  if (!raw && field.booleanValues)
    return booleanSql(column, field.booleanValues.mappings, field.booleanValues.lowercase);
  if (!raw && field.sourceType) {
    column = field.logicalType === 'date' ? parseDateSql(column) : numericTextSql(column, field.type);
  }
  const type = raw ? field.sourceType ?? field.type : field.type;
  return nanAsNull && floatingPoint.test(type) ? withoutNaN(column) : column;
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

function dateValue({ column, field }: ColumnContext): string {
  return logicalType(field!.type) === 'date' ? column! : parseDateSql(column!);
}

function range(fn: string, context: ExpressionContext): string {
  if (context.field?.logicalType !== 'date') return withInfinity(fn, context);
  const value = dateValue(context);
  return `epoch_ms(${fn}(${value}) FILTER (WHERE isfinite(${value})))`;
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

function frequencyValue(value: string, field?: ProfileField): string {
  return field?.logicalType === 'date' || field?.profileType === 'Categorical' ? `CAST(${value} AS VARCHAR)` : value;
}

const fileRootOption = {
  validate: (value: unknown) => {
    z.string().refine(isAbsolute).parse(value);
  },
};

function filePathsSql(context: ExpressionContext): string {
  if (!context.metric.root) throw new Error(`${context.metric.id} requires an absolute root directory`);
  return `COALESCE(list_transform(list_sort(${frequencyRanks(context)}), lambda entry:
    struct_pack(value := CAST(struct_extract(entry, 'value') AS VARCHAR),
      count := -struct_extract(entry, 'rank')::DOUBLE)), [])`;
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

function fixedWidth(type: string): number | undefined {
  if (/^(BOOLEAN|U?TINYINT)$/.test(type)) return 1;
  if (/^U?SMALLINT$/.test(type)) return 2;
  if (/^(U?INTEGER|FLOAT|REAL|DATE)$/.test(type)) return 4;
  if (/^(U?BIGINT|DOUBLE|TIMESTAMP(_S|_MS|_NS|TZ| WITH TIME ZONE)?|TIME)$/.test(type)) return 8;
  if (/^(U?HUGEINT|UUID|INTERVAL)$/.test(type)) return 16;
  const decimal = /^DECIMAL\((\d+),/.exec(type);
  if (!decimal) return undefined;
  const precision = Number(decimal[1]);
  if (precision <= 4) return 2;
  if (precision <= 9) return 4;
  return precision <= 18 ? 8 : 16;
}

function memorySize({ field, fields = [], sourceAlias }: ExpressionContext): string {
  const bytes = (field: ProfileField): string => {
    const value = profileValue(field, sourceAlias, false, true);
    const type = (field.sourceType ?? field.type).toUpperCase();
    const width = fixedWidth(type);
    if (width) return `count(*) * ${width}`;
    const length = type === 'BLOB' ? `octet_length(${value})` : `strlen(CAST(${value} AS VARCHAR))`;
    return `coalesce(sum(${length}), 0)`;
  };
  return field ? bytes(field) : fields.map(bytes).join(' + ') || '0';
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

const nonnegativeLimit = {
  validate(value: unknown): void {
    z.number().int().nonnegative().parse(value);
  },
};

const customSample = z
  .object({
    name: z.string().min(1),
    caption: z.string().optional(),
    data: z.array(z.record(z.string(), jsonValue)),
  })
  .strict();

function orderField({ fields, metric }: ExpressionContext): ProfileField | undefined {
  if (metric.orderBy === undefined) return undefined;
  const field = fields?.find(({ name }) => name === metric.orderBy);
  if (!field) throw new Error(`Unknown ${metric.id} order column: ${metric.orderBy}`);
  return field;
}

function timeIndex(context: ExpressionContext): string {
  const { fields = [], sourceAlias, nanAsNull } = context;
  const index = orderField(context);
  const series = fields
    .filter(({ profileType }) => profileType === 'TimeSeries')
    .map((field) => `(count(${profileValue(field, sourceAlias, nanAsNull)}) > 0)::INTEGER`);
  const seriesCount = series.length ? series.join(' + ') : '0';
  if (!index)
    return `struct_pack(n_series := ${seriesCount}, length := count(*)::DOUBLE,
    start := CASE WHEN count(*) > 0 THEN 0 END, "end" := CASE WHEN count(*) > 0 THEN (count(*) - 1)::DOUBLE END,
    period := CASE WHEN count(*) > 1 THEN 1 END)`;
  const column = profileValue(index, sourceAlias, nanAsNull);
  let position = column;
  if (index.logicalType === 'date') position = `epoch_ms(${dateValue({ column, field: index })})`;
  else if (index.logicalType !== 'numeric') throw new Error('time_index requires a numeric or date order column');
  const valid = `FILTER (WHERE isfinite(${position}))`;
  const lo = `(min(${position}) ${valid})::DOUBLE`;
  const hi = `(max(${position}) ${valid})::DOUBLE`;
  return `struct_pack(n_series := ${seriesCount}, length := count(*)::DOUBLE, start := ${lo}, "end" := ${hi},
    period := CASE WHEN count(*) > 1 AND count(${position}) ${valid} = count(*) THEN (${hi} - ${lo}) / (count(*) - 1) END)`;
}

function orderedValuesSql(context: ExpressionContext): string {
  const index = orderField(context);
  const order = index ? ` ORDER BY ${sqlQualifiedName(index.name, context.sourceAlias)} NULLS LAST` : '';
  const value = `TRY_CAST(${context.column} AS DOUBLE)`;
  return `coalesce(list(${value}${order}) FILTER (WHERE isfinite(${value})), [])`;
}

function timeSeriesPoints(context: ExpressionContext): string {
  const { table, column, sourceAlias, metric } = context;
  const index = orderField(context);
  const limit = (metric.limit as number | undefined) ?? 1200;
  let axis = 'row_number() OVER () - 1';
  if (index) {
    const source = profileValue(index, sourceAlias, context.nanAsNull);
    if (index.logicalType === 'date') axis = `epoch_ms(${dateValue({ column: source, field: index })})`;
    else if (index.logicalType === 'numeric') axis = source;
    else throw new Error('time_series requires a numeric or date order column');
  }
  const point = 'struct_pack(x := x, y := y, i := i)';
  return `first((WITH observations AS (
    SELECT (${axis})::DOUBLE AS x, try_cast(${column} AS DOUBLE) AS y FROM ${table}
  ), indexed AS (
    SELECT x, CASE WHEN isfinite(y) THEN y END AS y,
      row_number() OVER (${index ? 'ORDER BY x NULLS LAST' : ''}) - 1 AS i, count(*) OVER () AS n FROM observations
  ), grouped AS (
    SELECT first(n) AS n, arg_min(${point}, i) AS original,
      arg_min(${point}, struct_pack(y := y, i := i)) FILTER (WHERE y IS NOT NULL) AS lo,
      arg_max(${point}, struct_pack(y := y, i := -i)) FILTER (WHERE y IS NOT NULL) AS hi
    FROM indexed GROUP BY CASE WHEN n <= ${limit} THEN i ELSE ((i + 1)::HUGEINT * ${Math.floor(limit / 2)} - 1) // n END
  ), selected AS (
    SELECT n, unnest(CASE WHEN lo IS NULL THEN [original] WHEN lo.i = hi.i THEN [lo] ELSE [lo, hi] END) AS p FROM grouped
  ) SELECT struct_pack(count := coalesce(max(n), 0)::DOUBLE, date_index := ${index?.logicalType === 'date'},
    points := coalesce(list(struct_pack(x := CASE WHEN isfinite(p.x) THEN p.x END, y := p.y) ORDER BY p.i), [])) FROM selected))`;
}

function selectFields({ fields = [], metric }: ExpressionContext): ProfileField[] {
  if (metric.columns === undefined) return fields;
  const known = new Map(fields.map((field) => [field.name, field]));
  return (metric.columns as string[]).map((name) => {
    const field = known.get(name);
    if (!field) throw new Error(`Unknown ${metric.id} column: ${name}`);
    return field;
  });
}

function rowStruct(fields: ProfileField[], { sourceAlias, nanAsNull }: ExpressionContext): string {
  return `struct_pack(${fields
    .map((field) => `${sqlIdentifier(field.name)} := ${profileValue(field, sourceAlias, nanAsNull, true)}`)
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
  const fields = selectFields(context).filter(
    (field) => (context.nanAsNull ? logicalType(field.sourceType ?? field.type) : field.logicalType) === 'numeric'
  );
  if (context.metric.columns && fields.length !== (context.metric.columns as string[]).length) {
    const method = context.metric.id;
    throw new Error(`${method[0].toUpperCase()}${method.slice(1)} correlation requires numeric columns`);
  }
  return fields;
}

function scatterPairs(context: ExpressionContext): string {
  const fields = selectFields(context).filter(({ logicalType }) => logicalType === 'numeric');
  if (context.metric.columns && fields.length !== (context.metric.columns as string[]).length) {
    throw new Error('scatter_pairs requires numeric columns');
  }
  const { targets, threshold = 1000, gridsize = 15 } = context.metric;
  const series = fields.map((field, i) => ({
    name: field.name,
    alias: `c${i}`,
    value: profileValue(field, context.sourceAlias),
  }));
  const known = new Map(series.map((field) => [field.name, field]));
  const selected =
    targets === undefined
      ? series
      : (targets as string[]).map((name) => {
          const field = known.get(name);
          if (!field) throw new Error(`Unknown scatter target: ${name}`);
          return field;
        });
  if (!series.length) return 'coalesce(first(NULL), [])';
  const input = context.table.toLowerCase().startsWith('"__ava_scatter_rows"')
    ? '__ava_scatter_rows_2'
    : '__ava_scatter_rows';
  const projection = series.map(({ alias, value }) => `try_cast(${value} AS DOUBLE) AS ${alias}`);
  const present = series.map(({ alias }) => `coalesce(bool_or(NOT isnan(${alias})), false) AS ${alias}`);
  const pairs = series.flatMap((right) =>
    selected.map(
      (left) =>
        `CASE WHEN ${left.alias} AND ${right.alias}
      THEN (${scatterPairSql(input, left, right, threshold as number, gridsize as number)}) END`
    )
  );
  return `coalesce(first((WITH ${input} AS MATERIALIZED (
    SELECT row_number() OVER () AS position, ${projection.join(', ')} FROM ${context.table}
  ) SELECT list_filter([${pairs.join(', ')}], lambda pair: pair IS NOT NULL)
  FROM (SELECT ${present.join(', ')} FROM ${input}) present)), [])`;
}

const emptyCorrelation = 'struct_pack(columns := []::VARCHAR[], matrix := COALESCE(first(NULL), []::DOUBLE[][]))';

function correlationMatrix(
  fields: MetricField[],
  coefficient: (i: number, j: number) => string,
  normalize = true
): string {
  const columns = fields.map(({ name }) => sqlStringLiteral(name));
  const rows = fields.map(
    (_, i) => `[${fields.map((_, j) => coefficient(Math.min(i, j), Math.max(i, j))).join(', ')}]`
  );
  const matrix = `[${rows.join(', ')}]`;
  return `struct_pack(columns := [${columns.join(', ')}], matrix := ${
    normalize
      ? `list_transform(${matrix}, lambda r: list_transform(r, lambda v: CASE WHEN isfinite(v) THEN greatest(-1, least(1, v)) END))`
      : matrix
  })`;
}

function filterCorrelation(matrix: string, flags: string): string {
  return `list_transform([struct_pack(result := ${matrix}, flags := ${flags})], lambda item:
    CASE WHEN list_count(list_filter(item.flags, lambda included: included)) >= 2 THEN
      struct_pack(columns := list_filter(item.result.columns, lambda c, i: item.flags[i]),
        matrix := list_transform(list_filter(item.result.matrix, lambda r, i: item.flags[i]),
          lambda r: list_filter(r, lambda v, j: item.flags[j]))) END)[1]`;
}

function missingMask(field: ProfileField, sourceAlias?: string): string {
  const column = sqlQualifiedName(field.name, sourceAlias);
  return floatingPoint.test(field.sourceType ?? field.type)
    ? `(${column} IS NULL OR isnan(${column}))`
    : `(${column} IS NULL)`;
}

function missingMatrix(context: ExpressionContext): string {
  const fields = selectFields(context);
  const columns = `[${fields.map(({ name }) => sqlStringLiteral(name)).join(', ')}]::VARCHAR[]`;
  const limit = context.metric.limit;
  let rows = '[]::VARCHAR[]';
  if (fields.length && limit !== 0) {
    const masks = fields.map((field) => `CASE WHEN ${missingMask(field, context.sourceAlias)} THEN '1' ELSE '0' END`);
    const mask = `concat(${masks.join(', ')})`;
    rows =
      limit === undefined
        ? `coalesce(list(${mask}), [])`
        : `coalesce(first((SELECT arg_min(mask, position, ${limit}) FROM (
        SELECT ${mask} AS mask, row_number() OVER () AS position FROM ${context.table}
      ) ordered_rows)), [])`;
  }
  return `struct_pack(columns := ${columns}, row_count := count(*)::DOUBLE, rows := ${rows})`;
}

function missingBands(context: ExpressionContext): string {
  const fields = selectFields(context);
  const columns = `[${fields.map(({ name }) => sqlStringLiteral(name)).join(', ')}]::VARCHAR[]`;
  if (!fields.length) return `struct_pack(columns := ${columns}, row_count := count(*)::DOUBLE, bands := [])`;
  const { bands = 200 } = context.metric;
  const masks = fields.map((field, i) => `NOT ${missingMask(field, context.sourceAlias)} AS present${i}`);
  const present = `[${fields.map((_, i) => `avg(present${i}::DOUBLE)`).join(', ')}]`;
  const candidate = 'floor(position * segments / total)';
  const bucket = `(${candidate} + (position >= round_even((total / segments) * (${candidate} + 1), 0))::INTEGER)`;
  return `first((SELECT struct_pack(columns := ${columns}, row_count := coalesce(first(total), 0),
      bands := coalesce(list(struct_pack(start := start, "end" := finish, present := present) ORDER BY bucket), []))
    FROM (SELECT ${bucket} AS bucket, total, min(position)::DOUBLE AS start,
      (max(position) + 1)::DOUBLE AS finish, ${present} AS present
      FROM (SELECT row_number() OVER () - 1 AS position, ${masks.join(', ')} FROM ${context.table}) positions
      CROSS JOIN (SELECT count(*)::DOUBLE AS total, greatest(1, least(${bands}, count(*)))::DOUBLE AS segments
        FROM ${context.table}) cardinality
      GROUP BY bucket, total) grouped))`;
}

function missingCorrelation(context: ExpressionContext): string {
  const fields = selectFields(context);
  if (fields.length < 2) return 'first(NULL)';
  const masks = fields.map((field) => missingMask(field, context.sourceAlias));
  const counts = masks.map((mask) => `count(*) FILTER (WHERE ${mask})`);
  const flags = counts.map((count) => `${count} BETWEEN 1 AND count(*) - 1`);
  const matrix = correlationMatrix(fields, (i, j) => {
    if (i === j) return '1::DOUBLE';
    const left = `(${counts[i]})`;
    const right = `(${counts[j]})`;
    const both = `(count(*) FILTER (WHERE ${masks[i]} AND ${masks[j]}))`;
    // Pearson on binary masks is determined by the four contingency counts.
    return `(count(*)::HUGEINT * ${both} - ${left}::HUGEINT * ${right})::DOUBLE
      / nullif(sqrt(${left}::DOUBLE * (count(*) - ${left}) * ${right} * (count(*) - ${right})), 0)`;
  });
  return filterCorrelation(matrix, `[${flags.join(', ')}]`);
}

function pearson(context: ExpressionContext): string {
  const fields = numericCorrelationFields(context);
  if (!fields.length) return emptyCorrelation;
  const values = fields.map(
    (field) => `TRY_CAST(${profileValue(field, context.sourceAlias, false, context.nanAsNull)} AS DOUBLE)`
  );
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
    (field, i) => `TRY_CAST(${profileValue(field, context.sourceAlias, false, context.nanAsNull)} AS DOUBLE) AS c${i}`
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
  const phik = context.metric.id === 'phi_k';
  const fields = selectFields(context).filter(
    ({ logicalType, profileType }) =>
      (phik && logicalType !== 'unknown') ||
      (logicalType === 'string' && (!profileType || profileType === 'Categorical')) ||
      logicalType === 'boolean' ||
      ((automatic || columns !== undefined) && logicalType === 'numeric')
  );
  if (columns && fields.length !== (columns as string[]).length) {
    throw new Error(
      phik
        ? 'Phi-k requires supported columns'
        : `${automatic ? 'Automatic correlation' : "Cramér's V"} requires text, boolean or numeric category columns`
    );
  }
  if (fields.length < 2) return 'first(NULL)';

  const input = context.table.toLowerCase().startsWith('"__ava_category_rows"')
    ? '__ava_category_rows_2'
    : '__ava_category_rows';
  const projection = fields.map((field, i) => `${profileValue(field, context.sourceAlias, true, true)} AS c${i}`);
  const numeric = fields.map(({ logicalType }) => (automatic || phik) && logicalType === 'numeric');
  const binnedNumeric = numeric.map((selected, i) => selected && !(context.nanAsNull && fields[i].sourceType));
  const needsBins = binnedNumeric.some(Boolean) && (phik || !numeric.every(Boolean));
  const eligibility = fields.map(({ booleanValues, sourceType, type, logicalType }, i) => {
    const value = booleanValues
      ? booleanSql(`c${i}`, booleanValues.mappings, booleanValues.lowercase)
      : sourceType
      ? logicalType === 'date'
        ? parseDateSql(`c${i}`)
        : numericTextSql(`c${i}`, type)
      : `c${i}`;
    return numeric[i] ? `count(DISTINCT ${value}) > 1` : `count(DISTINCT ${value}) BETWEEN 2 AND ${maxCategories}`;
  });
  const bounds: string[] = [];
  const buckets: string[] = [];
  for (let i = 0; i < fields.length; i += 1) {
    if (!binnedNumeric[i] || !needsBins) continue;
    const value = `c${i}::DOUBLE`;
    const min = `min(${value}) FILTER (WHERE isfinite(${value}))`;
    const lower = phik ? `(${min}) - greatest(1e-14 * abs(${min}), 2.2250738585072014e-308)` : min;
    bounds.push(`${lower} AS lo${i},
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
  const bin = (i: number) => `${needsBins && binnedNumeric[i] ? 'b' : 'c'}${i}`;
  const checks = numeric.flatMap((yes, i) => (yes ? [`count(*) FILTER (WHERE isinf(c${i}::DOUBLE)) = 0`] : []));
  const supported =
    phik && context.nanAsNull && fields.some(({ sourceType, logicalType }) => sourceType && logicalType === 'numeric')
      ? 'FALSE'
      : checks.length
      ? checks.join(' AND ')
      : 'TRUE';
  const categories = needsBins ? binned : input;
  const pairs: string[] = [];
  for (let i = 0; i < fields.length; i += 1) {
    for (let j = i + 1; j < fields.length; j += 1) {
      const active = `(SELECT supported AND flags[${i + 1}] AND flags[${j + 1}] FROM eligibility)`;
      const pair = phik
        ? phiKPair(categories, bin(i), bin(j), active)
        : numeric[i] && numeric[j]
        ? spearmanPair(input, `c${i}::DOUBLE`, `c${j}::DOUBLE`, active)
        : cramersPair(categories, bin(i), bin(j), active, automatic);
      pairs.push(`(${pair}) AS p${i}_${j}`);
    }
  }
  const matrix = correlationMatrix(fields, (i, j) => (i === j ? (phik ? 'NULL' : '1::DOUBLE') : `p${i}_${j}`), !phik);
  return `first((WITH ${input} AS MATERIALIZED (SELECT ${projection.join(', ')} FROM ${context.table}),
    eligibility AS (SELECT [${eligibility.join(', ')}] AS flags, ${supported} AS supported
      ${bounds.length ? `, ${bounds.join(', ')}` : ''} FROM ${input}),
    ${
      needsBins
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
  return field?.logicalType === 'date'
    ? `epoch_ms(${dateValue({ column, field })})::DOUBLE`
    : `TRY_CAST(${column} AS DOUBLE)`;
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
  { id: 'memory_size', enable: () => true, expression: memorySize },
  {
    id: 'record_size',
    enable: table,
    expression: (context) => `coalesce((${memorySize(context)})::DOUBLE / nullif(count(*), 0), 0)`,
  },
  { id: 'time_index', enable: table, options: { orderBy: orderByOption }, expression: timeIndex },
  {
    id: 'row_sample',
    enable: table,
    options: {
      columns: columnNamesOption,
      custom: {
        validate: (value) => {
          customSample.parse(value);
        },
      },
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
  {
    id: 'scatter_pairs',
    enable: table,
    options: {
      columns: columnNamesOption,
      targets: columnNamesOption,
      threshold: {
        validate: (value) => {
          z.number().int().nonnegative().parse(value);
        },
      },
      gridsize: {
        validate: (value) => {
          z.number().int().positive().parse(value);
        },
      },
    },
    expression: scatterPairs,
  },
  { id: 'missing_correlation', enable: table, options: { columns: columnNamesOption }, expression: missingCorrelation },
  {
    id: 'missing_matrix',
    enable: table,
    options: {
      columns: columnNamesOption,
      limit: {
        validate: (value) => {
          z.number().int().nonnegative().parse(value);
        },
      },
    },
    expression: missingMatrix,
  },
  {
    id: 'missing_bands',
    enable: table,
    options: {
      columns: columnNamesOption,
      bands: {
        validate: (value) => {
          z.number().int().positive().parse(value);
        },
      },
    },
    expression: missingBands,
  },
  ...['cramers', 'auto', 'phi_k'].map(
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
        ...(id !== 'cramers'
          ? {
              bins: {
                validate: (value: unknown) => {
                  z.number().int().positive().parse(value);
                },
              },
            }
          : {}),
        ...(id === 'phi_k'
          ? {
              noiseCorrection: {
                validate: (value: unknown) => {
                  z.boolean().parse(value);
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
    id: 'extreme_values',
    enable: logicalTypes('numeric'),
    options: { limit: nonnegativeLimit },
    expression: (context) => {
      const { limit = 5 } = context.metric;
      const entries = `list_transform(${frequencyRanks(context)}, lambda entry:
        struct_pack(value := entry.value, count := -entry.rank::DOUBLE))`;
      const side = (order: string) => `coalesce(list_slice(list_sort(${entries}, '${order}'), 1, ${limit}), [])`;
      return `struct_pack(lowest := ${side('ASC')}, highest := ${side('DESC')})`;
    },
  },
  {
    id: 'text_examples',
    enable: logicalTypes('string'),
    options: { limit: nonnegativeLimit },
    expression: ({ column, table, metric }) => `coalesce(first((SELECT list(value ORDER BY position)
      FROM (SELECT CAST(${column} AS VARCHAR) AS value, row_number() OVER () AS position FROM ${table}
        WHERE ${column} IS NOT NULL LIMIT ${metric.limit ?? 5}) sample_values)), [])`,
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
        if (index.logicalType === 'date') position = `epoch_ms(${dateValue({ column, field: index })})`;
        else if (index.logicalType === 'numeric') position = column;
        else throw new Error('time_series_gaps requires a numeric or date order column');
      }
      const value = context.column!;
      const observed = floatingPoint.test(field!.type)
        ? `(${value} IS NOT NULL AND NOT isnan(${value}))`
        : `${value} IS NOT NULL`;
      return timeGapsSql(table, observed, position);
    },
  },
  {
    id: 'time_series',
    enable: logicalTypes('numeric'),
    options: {
      orderBy: orderByOption,
      limit: {
        validate: (value) => {
          z.number().int().min(2).parse(value);
        },
      },
    },
    expression: timeSeriesPoints,
  },
  {
    id: 'frequency_spectrum',
    enable: logicalTypes('numeric'),
    options: {
      orderBy: orderByOption,
      madThreshold: {
        validate: (value) => {
          z.number().nonnegative().parse(value);
        },
      },
    },
    expression: orderedValuesSql,
  },
  {
    id: 'adf',
    enable: logicalTypes('numeric'),
    options: {
      orderBy: orderByOption,
      maxLag: {
        validate: (value) => {
          z.number().int().nonnegative().parse(value);
        },
      },
      autolag: {
        validate: (value) => {
          z.enum(['AIC', 'BIC', 't-stat']).nullable().parse(value);
        },
      },
      significance: {
        validate: (value) => {
          z.number().min(0).max(1).parse(value);
        },
      },
    },
    expression: orderedValuesSql,
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
  {
    id: 'file_summary',
    enable: ({ target, field }) => {
      const type = (field as ProfileField | undefined)?.profileType;
      return target === 'column' && (type === 'File' || type === 'Image');
    },
    options: { root: fileRootOption },
    expression: filePathsSql,
  },
  {
    id: 'image_summary',
    enable: ({ target, field }) => target === 'column' && (field as ProfileField | undefined)?.profileType === 'Image',
    options: {
      root: fileRootOption,
      exif: {
        validate: (value) => {
          z.boolean().parse(value);
        },
      },
    },
    expression: filePathsSql,
  },
  {
    id: 'date_validation',
    enable: logicalTypes('string', 'date'),
    expression: ({ column, field }) => dateValidationSql(column!, logicalType(field!.type) === 'date'),
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

const sensitiveMetrics = new Set([
  'row_count',
  'table_summary',
  'memory_size',
  'record_size',
  'time_index',
  'valid_count',
  'null_count',
  'null_ratio',
  'distinct_count',
  'distinct_ratio',
  'unique_count',
  'unique_ratio',
  'is_unique',
  'duplicate_count',
  'mode_count',
  'imbalance',
  'min',
  'max',
  'mean',
  'sum',
  'stddev',
  'median',
  'variance',
  'mad',
  'iqr',
  'cv',
  'range',
  'skewness',
  'kurtosis',
  'quantiles',
  'histogram',
  'monotonicity',
  'chi_squared',
  'date_validation',
  'min_length',
  'max_length',
  'mean_length',
  'median_length',
  'length_histogram',
  'pearson',
  'spearman',
  'kendall',
  'cramers',
  'auto',
  'phi_k',
  'missing_correlation',
  'missing_matrix',
  'missing_bands',
  'autocorrelation',
  'adf',
  ...['zero', 'negative', 'infinite', 'nan', 'finite'].flatMap((kind) => [`${kind}_count`, `${kind}_ratio`]),
]);

/** Decode aggregate values into profile metrics. */
async function postProcessMetrics(
  row: Record<string, unknown>,
  pending: { alias: string; metric: ParsedProfileOptions['metrics'][number]; output: Record<string, unknown> }[],
  referenceSemantics: boolean,
  unicodeProperties?: Parameters<typeof unicodeSummary>[1]
): Promise<void> {
  for (const { alias, metric, output } of pending) {
    const metricId = metric.id;
    const raw = row[alias];
    delete output[metricId];
    if (metricId === 'top_values' && raw == null) continue;
    if (metricId === 'chi_squared') {
      output[metricId] = chiSquareResult(raw as Parameters<typeof chiSquareResult>[0]);
    } else if (metricId === 'phi_k') {
      output[metricId] = phiKMatrix(raw as Parameters<typeof phiKMatrix>[0], metric.noiseCorrection !== false);
    } else if (metricId === 'autocorrelation') {
      output[metricId] = autocorrelationResult(raw as Parameters<typeof autocorrelationResult>[0]);
    } else if (metricId === 'frequency_spectrum') {
      output[metricId] = frequencySpectrum(raw as number[], (metric.madThreshold as number | undefined) ?? 6);
    } else if (metricId === 'adf') {
      const { maxLag, autolag = 'AIC', significance = 0.05 } = metric;
      output[metricId] = augmentedDickeyFuller(
        raw as number[],
        maxLag as number | undefined,
        autolag as Parameters<typeof augmentedDickeyFuller>[2],
        significance as number
      );
    } else if (metricId === 'unicode_summary') {
      output[metricId] = unicodeSummary(raw as Parameters<typeof unicodeSummary>[0], unicodeProperties!);
    } else if (metricId === 'file_summary') {
      output[metricId] = await fileSummary(raw as Parameters<typeof fileSummary>[0], metric.root as string);
    } else if (metricId === 'image_summary') {
      output[metricId] = await imageSummary(
        raw as Parameters<typeof imageSummary>[0],
        metric.root as string,
        metric.exif === true
      );
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
  const metrics = options.metrics
    .map((metric) => ({ metric, definition: resolveMetric(metric, BUILTIN_METRICS) }))
    .filter(({ metric }) => !options.sensitive || sensitiveMetrics.has(metric.id));
  const nanAsNull = options.semantics === 'data-profiling';
  const needsCenters = metrics.some(({ metric }) => metric.id === 'skewness' || metric.id === 'kurtosis');
  const needsMonotonicity = metrics.some(({ metric }) => metric.id === 'monotonicity');
  const needsChiSquare = metrics.some(({ metric }) => metric.id === 'chi_squared');
  const wordLowercase =
    options.inferTypes?.booleanMappings || metrics.some(({ metric }) => metric.id === 'word_counts')
      ? registerWordLowercase(connection)
      : undefined;
  const histogram = metrics.filter(({ metric }) => metric.id === 'histogram').pop()?.metric;
  const unicodeProperties = metrics.some(({ metric }) => metric.id === 'unicode_summary')
    ? (await import('./unicode-properties.json')).default
    : undefined;
  const profiles: Profile['models'] = [];
  const typeSchema = new Map(Object.entries(options.typeSchema ?? {}));
  for (const [model, columns] of typeSchema) {
    const source = schema.models.find(({ name }) => name === model);
    if (!source) throw new Error(`Unknown profile type override model: ${model}`);
    const unknown = Object.keys(columns).find((key) => !source.columns.some(({ name }) => name === key));
    if (unknown) throw new Error(`Unknown profile type override column: ${model}.${unknown}`);
  }

  for (const table of schema.models) {
    const { name, tableReference } = table;
    const reference = sqlQualifiedName(tableReference.table, tableReference.schema);
    const overrides = new Map(Object.entries(typeSchema.get(name) ?? {}));
    const fields: ProfileField[] = table.columns.map((field) => {
      const profileType = overrides.get(field.name);
      const native = logicalType(field.type);
      if (!profileType) return { ...field, logicalType: native };
      const target = logicalProfileTypes[profileType];
      if (
        ((target === 'numeric' || target === 'boolean') && target !== native) ||
        (target === 'date' && native !== 'date' && native !== 'string') ||
        ((profileType === 'URL' || profileType === 'Path' || profileType === 'File' || profileType === 'Image') &&
          native !== 'string')
      ) {
        throw new Error(`Cannot profile ${name}.${field.name} (${field.type}) as ${profileType}`);
      }
      return { ...field, logicalType: target, profileType };
    });
    if (options.inferTypes) {
      const candidates = fields.filter(({ profileType }) => !profileType);
      const inferred = await inferColumnTypes(
        connection,
        reference,
        candidates.map((field) => ({
          name: field.name,
          logicalType: field.logicalType,
          value: profileValue(field, undefined, true),
        })),
        options.sensitive ? { ...options.inferTypes, fileRoot: undefined, image: false } : options.inferTypes,
        options.inferTypes.booleanMappings ? wordLowercase : undefined
      );
      for (const field of candidates) {
        const { profileType, cast } = inferred.get(field.name)!;
        field.profileType = profileType;
        if (field.profileType === 'Boolean' && field.logicalType === 'string') {
          field.booleanValues = {
            mappings: options.inferTypes.booleanMappings,
            lowercase: options.inferTypes.booleanMappings ? wordLowercase : undefined,
          };
        }
        if (cast) {
          field.sourceType = field.type;
          field.type = cast;
        }
        field.logicalType = logicalProfileTypes[field.profileType];
      }
    }
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
        const column = profileValue(field);
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

    const pending: Parameters<typeof postProcessMetrics>[1] = [];
    const expressions = new Map<string, string>();

    const addMetrics = (output: Record<string, unknown>, field?: MetricField) => {
      const raw = field ? profileValue(field, sourceAlias) : undefined;
      const column = field ? profileValue(field, sourceAlias, nanAsNull) : undefined;
      for (const { metric, definition } of metrics) {
        const target = field ? 'column' : 'table';
        if (!definition.enable({ target, field }) || (metric.id === 'histogram' && metric !== histogram)) {
          continue;
        }
        if (metric.id === 'row_sample' && metric.custom !== undefined) {
          output.row_sample = { custom: metric.custom };
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
        pending.push({ alias, metric, output });
      }
    };

    addMetrics(profile.metrics);
    profile.columns = fields.map((field) => {
      const metrics = {};
      addMetrics(metrics, field);
      const properties = {
        logicalType: field.logicalType,
        ...(field.profileType && { profileType: field.profileType }),
      };
      return { name: field.name, properties, metrics };
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
    await postProcessMetrics(row, pending, nanAsNull, unicodeProperties);
    if (nanAsNull) {
      for (const [i, column] of profile.columns.entries()) {
        if (!row[`has_value${i}`]) {
          column.properties.logicalType = 'unknown';
          if (column.properties.profileType) column.properties.profileType = 'Unsupported';
        }
      }
    }
  }

  return {
    models: profiles,
    ...(options.semantics && { semantics: options.semantics }),
    ...(options.sensitive && { sensitive: true as const }),
  };
}
