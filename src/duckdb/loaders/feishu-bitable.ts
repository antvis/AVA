/**
 * Feishu Bitable loader: read a table, or every table of a base, through the
 * Bitable Open API and materialize each one as a typed DuckDB table.
 *
 * - Column types come from the field metadata, not from sampling values.
 * - Dates are read as the wall-clock values of the base's time zone.
 * - Multi-value fields become lists only when some record holds several values.
 * - Links show the primary field of the linked records. When the whole base is
 *   loaded, single-record links also get a `<field>_record_id` column joined to the
 *   linked table's `record_id` through a declared relationship.
 */

import { sqlIdentifier, sqlQualifiedName } from '../../util/sql';
import { getDuckDBSchema } from '../util/schema';

import {
  VALUE_TYPES,
  castValue,
  cellValues,
  commonKind,
  displayText,
  isLinkFieldType,
  isListFieldType,
  isSupportedFieldType,
  linkRecordIds,
  linkedTableId,
} from './feishu/convert';
import { readFeishuBase } from './feishu/read';

import type { ConvertContext, FeishuScalar } from './feishu/convert';
import type { FeishuBase, FeishuTable } from './feishu/read';
import type { DuckDBConnection, FeishuBitableSourceOptions, LoadedSource, Schema } from '../../types';

type Value = FeishuScalar | FeishuScalar[] | null;

interface Column {
  name: string;
  type: string;
  values: Value[];
}

interface TablePlan {
  name: string;
  primaryKey: string;
  columns: Column[];
  rowCount: number;
}

type SchemaRelationship = NonNullable<Schema['relationships']>[number];

/** A single-record link column that joins the linked table like a foreign key. */
interface LinkKey {
  table: string;
  column: string;
  idColumn: string;
  target: string;
  targetKey: string;
}

const SINGLE_TABLE_VIEW = 'data';

/** DuckDB identifiers are case-insensitive, so names are deduplicated ignoring case. */
function uniqueName(name: string, used: Set<string>): string {
  let candidate = name;
  for (let n = 2; used.has(candidate.toLowerCase()); n += 1) candidate = `${name}_${n}`;
  used.add(candidate.toLowerCase());
  return candidate;
}

/** Primary field text of every record, keyed by record ID. */
function recordLabels(table: FeishuTable, timeZone: string): Map<string, string> {
  const labels = new Map<string, string>();
  const primary = table.fields.find((field) => field.primary) ?? table.fields[0];
  if (!primary || !isSupportedFieldType(primary.type)) return labels;
  const ctx: ConvertContext = { timeZone, linkText: (_table, id) => id };
  for (const record of table.records) {
    const text = displayText(cellValues(primary, record.fields[primary.name], ctx));
    if (text !== undefined) labels.set(record.id, text);
  }
  return labels;
}

function planTables(base: FeishuBase): { plans: TablePlan[]; links: LinkKey[] } {
  const labels = new Map<string, Map<string, string>>();
  for (const table of [...base.tables, ...base.linkedTables]) labels.set(table.id, recordLabels(table, base.timeZone));
  const ctx: ConvertContext = {
    timeZone: base.timeZone,
    linkText: (tableId, id) => (tableId && labels.get(tableId)?.get(id)) || id,
  };

  const tableNames = new Set<string>();
  const names = new Map(
    base.tables.map((table) => [table.id, base.single ? SINGLE_TABLE_VIEW : uniqueName(table.name, tableNames)])
  );
  const primaryKeys = new Map<string, string>();
  const plans = base.tables.map((table) => {
    const used = new Set<string>();
    const fields = table.fields
      .filter((field) => isSupportedFieldType(field.type))
      .map((field) => ({ field, column: uniqueName(field.name, used) }));
    const primaryKey = uniqueName('record_id', used);
    primaryKeys.set(table.id, primaryKey);
    return { table, fields, used, primaryKey };
  });

  const links: LinkKey[] = [];
  const result = plans.map(({ table, fields, used, primaryKey }) => {
    const name = names.get(table.id)!;
    const columns: Column[] = [{ name: primaryKey, type: 'VARCHAR', values: table.records.map((record) => record.id) }];
    for (const { field, column } of fields) {
      const raw = table.records.map((record) => record.fields[field.name]);
      const cells = raw.map((value) => cellValues(field, value, ctx));
      const kind = commonKind(field, cells);
      const list = isListFieldType(field.type) && cells.some((cell) => cell.values.length > 1);
      columns.push({
        name: column,
        type: `${VALUE_TYPES[kind]}${list ? '[]' : ''}`,
        values: cells.map((cell) => {
          const values = cell.values.map((value) => castValue(value, cell.kind, kind));
          if (values.length === 0) return null;
          return list ? values : values[0];
        }),
      });

      // A link holding at most one record per row joins the linked table like a foreign key.
      const linked = isLinkFieldType(field.type) ? linkedTableId(field) : undefined;
      const target = linked ? names.get(linked) : undefined;
      if (!target || list) continue;
      const idColumn = uniqueName(`${column}_record_id`, used);
      columns.push({ name: idColumn, type: 'VARCHAR', values: raw.map((value) => linkRecordIds(value)[0] ?? null) });
      links.push({ table: name, column, idColumn, target, targetKey: primaryKeys.get(linked!)! });
    }
    return { name, primaryKey, columns, rowCount: table.records.length };
  });
  return { plans: result, links };
}

async function registerTable(conn: DuckDBConnection, plan: TablePlan, namespace?: string): Promise<void> {
  const name = sqlQualifiedName(plan.name, namespace);
  const definitions = plan.columns.map((column) => `${sqlIdentifier(column.name)} ${column.type}`);
  await conn.run(`CREATE TABLE ${name} (${definitions.join(', ')}, PRIMARY KEY (${sqlIdentifier(plan.primaryKey)}))`);
  if (plan.rowCount === 0) return;

  const rows: Record<string, Value>[] = [];
  for (let row = 0; row < plan.rowCount; row += 1) {
    const record: Record<string, Value> = {};
    for (const column of plan.columns) record[column.name] = column.values[row];
    rows.push(record);
  }
  // Bind the rows and their structure as parameters: no temporary files or interpolated values.
  const structure = Object.fromEntries(
    plan.columns.map((column) => [column.name, column.type.endsWith('[]') ? [column.type.slice(0, -2)] : column.type])
  );
  await conn.run(`INSERT INTO ${name} SELECT item.* FROM (SELECT unnest(from_json_strict($1::JSON, $2)) AS item)`, [
    JSON.stringify(rows),
    JSON.stringify([structure]),
  ]);
}

/** Declared joins for single-record links, named like the models of the (namespaced) schema. */
function linkRelationships(schema: Schema, links: LinkKey[], namespace?: string): SchemaRelationship[] {
  const models = new Map(schema.models.map((model) => [model.tableReference.table, model.name]));
  return links.map((link) => ({
    name: `${models.get(link.table)}.${link.column}`,
    models: [models.get(link.table)!, models.get(link.target)!],
    joinType: 'MANY_TO_ONE',
    condition: `${sqlQualifiedName(link.table, namespace)}.${sqlIdentifier(link.idColumn)} = ${sqlQualifiedName(
      link.target,
      namespace
    )}.${sqlIdentifier(link.targetKey)}`,
  }));
}

export async function loadFeishuBitable(options: FeishuBitableSourceOptions): Promise<LoadedSource> {
  const base = await readFeishuBase(options);
  const { plans, links } = planTables(base);
  const tableNames = plans.map((plan) => plan.name);

  return {
    register: async (conn, namespace) => {
      for (const plan of plans) await registerTable(conn, plan, namespace);
      return tableNames;
    },
    getSchema: async (conn, namespace) => {
      const schema = await getDuckDBSchema(conn, tableNames, namespace);
      if (links.length === 0) return schema;
      return {
        ...schema,
        relationships: [...(schema.relationships ?? []), ...linkRelationships(schema, links, namespace)],
      };
    },
    // Rows are copied into DuckDB tables; no file needs to stay readable.
    allowedPaths: [],
    cleanup: async () => {},
  };
}
