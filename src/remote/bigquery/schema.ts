/** Schema discovery through the BigQuery tables API; metadata reads are not billed. */
import { rowObjects2Schema } from '../../util/schema';
import { bigQueryIdentifier } from '../../util/sql';

import { fieldType } from './values';

import type { BigQueryApi, DatasetReference, Table } from './api';
import type { Schema } from '../../types';

/** Table types GoogleSQL can read; models (ML) are not listed by tables.list. */
const QUERYABLE_TYPES = new Set(['TABLE', 'VIEW', 'MATERIALIZED_VIEW', 'EXTERNAL', 'SNAPSHOT']);
const METADATA_CONCURRENCY = 8;
/** Date-sharded tables such as `events_20240131`: a prefix ending in a non-digit, then YYYYMMDD. */
const SHARD = /^(.*\D)\d{4}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])$/;

async function mapLimit<T, R>(items: T[], limit: number, map: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await map(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function catalogRows(table: Table, dataset: DatasetReference): Record<string, unknown>[] {
  const name = table.tableReference.tableId;
  const rows: Record<string, unknown>[] = [
    { kind: 'table', table_name: name, metadata: { catalog: dataset.projectId, schema: dataset.datasetId } },
  ];

  (table.schema?.fields ?? []).forEach((field, index) => {
    rows.push({
      kind: 'column',
      table_name: name,
      metadata: { name: field.name, type: fieldType(field), notNull: field.mode === 'REQUIRED', position: index + 1 },
    });
  });

  // Primary and foreign keys are declared NOT ENFORCED in BigQuery; they still describe the model.
  const primaryKey = table.tableConstraints?.primaryKey?.columns;
  if (primaryKey?.length) {
    rows.push({ kind: 'index', table_name: name, metadata: { unique: true, primary: true, columns: primaryKey } });
  }
  for (const foreignKey of table.tableConstraints?.foreignKeys ?? []) {
    const { referencedTable: target, columnReferences: pairs = [] } = foreignKey;
    // Only keys between exposed tables of this dataset become relationships.
    if (target?.projectId !== dataset.projectId || target?.datasetId !== dataset.datasetId || !target.tableId) continue;
    rows.push({
      kind: 'foreign-key',
      table_name: name,
      metadata: {
        name: foreignKey.name,
        columns: pairs.map((pair) => pair.referencingColumn),
        referencedTable: target.tableId,
        referencedColumns: pairs.map((pair) => pair.referencedColumn),
      },
    });
  }

  if (table.type === 'VIEW' && table.view?.query) {
    rows.push({ kind: 'view', table_name: name, metadata: { statement: table.view.query } });
  }
  return rows;
}

/**
 * Group date shards by wildcard name, e.g. `events_*`, as the BigQuery console does.
 * A lone table with a date suffix stays an ordinary table.
 * https://cloud.google.com/bigquery/docs/querying-wildcard-tables
 */
function shardGroups(tables: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const table of tables) {
    const prefix = SHARD.exec(table)?.[1];
    if (prefix) groups.set(`${prefix}*`, [...(groups.get(`${prefix}*`) ?? []), table]);
  }
  for (const [wildcard, shards] of groups) {
    if (shards.length < 2) groups.delete(wildcard);
  }
  return groups;
}

/**
 * A wildcard table has the schema of its newest shard plus the `_TABLE_SUFFIX` pseudo column,
 * which filters the shards a query reads.
 */
function wildcardTable(shard: Table, wildcard: string): Table {
  return {
    tableReference: { ...shard.tableReference, tableId: wildcard },
    type: 'TABLE',
    schema: { fields: [...(shard.schema?.fields ?? []), { name: '_TABLE_SUFFIX', type: 'STRING', mode: 'REQUIRED' }] },
  };
}

/**
 * Discover the dataset's queryable tables and views, or only the requested ones.
 * Legacy SQL views are skipped because GoogleSQL queries cannot reference them. Date-sharded
 * tables are exposed as one wildcard model unless their shards are requested individually.
 */
export async function getBigQuerySchema(
  api: BigQueryApi,
  dataset: DatasetReference,
  tables?: string[]
): Promise<Schema> {
  const queryable = (await api.listTables(dataset))
    .filter(({ type = 'TABLE', view }) => QUERYABLE_TYPES.has(type) && !(type === 'VIEW' && view?.useLegacySql))
    .map(({ tableReference }) => tableReference.tableId);
  const shards = shardGroups(queryable);

  if (tables) {
    const missing = tables.filter((table) => !queryable.includes(table) && !shards.has(table));
    if (missing.length) {
      throw new Error(
        `BigQuery dataset ${dataset.projectId}.${dataset.datasetId} has no queryable table named ${missing
          .map((table) => JSON.stringify(table))
          .join(', ')}`
      );
    }
  }

  const sharded = new Set([...shards.values()].flat());
  const selected = tables ?? [...queryable.filter((table) => !sharded.has(table)), ...shards.keys()];
  const metadata = await mapLimit(selected, METADATA_CONCURRENCY, async (name) => {
    const group = shards.get(name);
    if (!group) return api.getTable({ ...dataset, tableId: name });
    // YYYYMMDD suffixes sort chronologically.
    return wildcardTable(await api.getTable({ ...dataset, tableId: [...group].sort().pop()! }), name);
  });
  return rowObjects2Schema(
    metadata.flatMap((table) => catalogRows(table, dataset)),
    bigQueryIdentifier
  );
}
