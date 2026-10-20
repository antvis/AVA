import { smqSchema } from '../schema';
import { JoinGraph } from '../join-graph';
import { SemanticRegistry } from '../registry';

import { getDialect } from './dialect';
import { parseFilter } from './resolver';

import type { SQLDialect } from './dialect';
import type { ResolvedElement } from '../registry';
import type { CompiledSMQ, SMQ } from '../types';

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function renderTable(table: string, dialect: SQLDialect): string {
  if (dialect.name === 'bigquery') return dialect.quoteIdentifier(table);
  return table
    .split('.')
    .map((part) => dialect.quoteIdentifier(part))
    .join('.');
}

function renderElement(resolved: ResolvedElement, dialect: SQLDialect): string {
  const alias = dialect.quoteIdentifier(resolved.model.name);
  const bind = (expr: string) => expr.split('{TABLE}').join(alias);

  if (resolved.dimension || resolved.measure) {
    const { column, expr } = (resolved.dimension ?? resolved.measure)!;
    return column !== undefined ? `${alias}.${dialect.quoteIdentifier(column)}` : bind(expr!);
  }

  const { agg, column, expr } = resolved.metric!;
  if (!agg) return bind(expr!);
  const argument =
    column !== undefined ? `${alias}.${dialect.quoteIdentifier(column)}` : expr !== undefined ? bind(expr) : undefined;
  return dialect.aggregate(agg, argument);
}

/** Compile an SMQ into SQL. Pure and deterministic: no LLM and no database access. */
export function compileSMQ(
  registry: SemanticRegistry,
  input: SMQ,
  dialectName = registry.dialect ?? 'duckdb'
): CompiledSMQ {
  const smq = smqSchema.parse(input);
  const dialect = getDialect(dialectName);

  const metrics = unique(smq.metrics ?? []);
  const groupBy = unique(smq.group_by ?? []);
  if (metrics.length === 0 && groupBy.length === 0) throw new Error('SMQ requires at least one metric or group_by');

  const resolveGrouping = (ref: string) => {
    const resolved = registry.resolve(ref);
    if (resolved.kind === 'metric') throw new Error(`"${ref}" is a metric; group_by requires a dimension or measure`);
    return resolved;
  };

  const targetElements = metrics.map((ref) => registry.resolve(ref));
  const dimensionElements = groupBy.map(resolveGrouping);

  const where: string[] = [];
  const having: string[] = [];
  const filterModels: string[] = [];

  for (const filter of smq.filters ?? []) {
    const parsed = parseFilter(filter, dialect, (ref) => renderElement(registry.resolve(ref), dialect));
    const kinds = unique(parsed.refs.map((ref) => registry.resolve(ref).kind === 'metric'));
    if (kinds.length > 1) throw new Error(`Filter "${filter}" mixes row-level elements and metrics`);
    filterModels.push(...parsed.refs.map((ref) => registry.resolve(ref).model.name));
    (kinds[0] ? having : where).push(parsed.sql);
  }

  const outputs = unique([...groupBy, ...metrics]);
  const selected = outputs.map((ref) => registry.resolve(ref));
  const aggregate = selected.some((element) => element.kind === 'metric') || having.length > 0;
  const grouping = selected.filter((element) => element.kind !== 'metric');
  const modelNames = unique([
    ...targetElements.map((e) => e.model.name),
    ...dimensionElements.map((e) => e.model.name),
    ...filterModels,
  ]);
  const root = modelNames[0];
  const steps = new JoinGraph(registry.joins).plan(root, modelNames.slice(1));

  const select = outputs.map((ref, i) => `${renderElement(selected[i], dialect)} AS ${dialect.quoteIdentifier(ref)}`);

  const rootModel = registry.models.get(root)!;
  const from = [`FROM ${renderTable(rootModel.table, dialect)} AS ${dialect.quoteIdentifier(root)}`];
  for (const step of steps) {
    const target = registry.models.get(step.to)!;
    const bind = (expr: string) =>
      expr.replace(/\{(FROM|TO)\}/g, (_, side) => dialect.quoteIdentifier(side === 'FROM' ? step.from : step.to));
    const on = step.on
      ? bind(step.on)
      : step
          .keys!.map(
            (k) =>
              `${dialect.quoteIdentifier(step.from)}.${dialect.quoteIdentifier(k.from)} = ${dialect.quoteIdentifier(
                step.to
              )}.${dialect.quoteIdentifier(k.to)}`
          )
          .join(' AND ');
    from.push(
      `${step.type.toUpperCase()} JOIN ${renderTable(target.table, dialect)} AS ${dialect.quoteIdentifier(
        step.to
      )} ON ${on}`
    );
  }

  const lines = [`SELECT${!aggregate && groupBy.length > 0 ? ' DISTINCT' : ''} ${select.join(', ')}`, ...from];
  if (where.length) lines.push(`WHERE ${where.join(' AND ')}`);
  if (aggregate && grouping.length)
    lines.push(`GROUP BY ${unique(grouping.map((e) => renderElement(e, dialect))).join(', ')}`);
  if (having.length) lines.push(`HAVING ${having.join(' AND ')}`);

  if (smq.order_by?.length) {
    const order = smq.order_by.map(({ field, direction }) => {
      if (!outputs.includes(field))
        throw new Error(`order_by field "${field}" must be one of the selected metrics or group_by`);
      return `${dialect.quoteIdentifier(field)} ${direction === 'desc' ? 'DESC' : 'ASC'}`;
    });
    lines.push(`ORDER BY ${order.join(', ')}`);
  }
  if (smq.limit !== undefined) lines.push(`LIMIT ${smq.limit}`);

  const tables = [rootModel.table, ...steps.map((s) => registry.models.get(s.to)!.table)];

  return {
    sql: lines.join('\n'),
    grain: aggregate ? 'aggregate' : groupBy.length ? 'distinct' : 'rows',
    columns: outputs,
    models: [root, ...steps.map((s) => s.to)],
    tables,
  };
}
