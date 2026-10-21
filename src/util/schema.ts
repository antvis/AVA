/** Catalog discovery and structural validation. */
import { z } from 'zod';

import { sqlIdentifier } from './sql';

import type { JsonValue, Schema } from '../types';

export const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number().finite(), z.boolean(), z.null(), z.array(jsonValue), z.record(jsonValue)])
);
const name = z.string();
const key = z.union([name, z.array(name).nonempty()]);
export const schemaStructure = z.object({
  models: z.array(
    z.object({
      name,
      tableReference: z.object({ catalog: name.optional(), schema: name.optional(), table: name }),
      columns: z.array(z.object({ name, type: name, notNull: z.boolean().optional() })),
      primaryKey: key.optional(),
      uniqueKeys: z.array(key).optional(),
    })
  ),
  relationships: z
    .array(
      z.object({
        name,
        models: z.tuple([name, name]),
        joinType: z.enum(['ONE_TO_ONE', 'MANY_TO_ONE']),
        condition: name,
      })
    )
    .optional(),
  views: z.array(z.object({ name, statement: name })).optional(),
});
export const schemaMetadataSchema = schemaStructure as unknown as z.ZodType<Schema>;

function inferType(values: any[]): 'number' | 'string' | 'date' | 'boolean' | 'unknown' {
  const nonNullValues = values.filter((v) => v != null && v !== '');

  if (nonNullValues.length === 0) return 'string';

  if (nonNullValues.some((v) => typeof v === 'object')) return 'unknown';

  const allBooleans = nonNullValues.every(
    (v) => typeof v === 'boolean' || v === 'true' || v === 'false' || v === 'TRUE' || v === 'FALSE'
  );
  if (allBooleans) return 'boolean';

  const allNumbers = nonNullValues.every((v) => typeof v === 'number' || !Number.isNaN(Number(v)));
  if (allNumbers) return 'number';

  const allDates = nonNullValues.every((v) => {
    if (typeof v === 'string') {
      const date = new Date(v);
      return !Number.isNaN(date.getTime());
    }
    return false;
  });
  if (allDates) return 'date';

  return 'string';
}

/** Infer column types for an in-memory model. */
export function extractDataSchema(data: any[]): Schema {
  return {
    models: [
      {
        name: 'data',
        tableReference: { table: 'data' },
        columns: Object.keys(data?.[0] ?? {}).map((name) => ({ name, type: inferType(data.map((row) => row[name])) })),
      },
    ],
  };
}

/** Extract plain index keys; expression indexes are not model identifiers. */
function indexColumns(definition: string): string[] | undefined {
  const identifier = '(?:"(?:[^"]|"")*"|[^\\s"().]+)';
  const match = definition.match(
    new RegExp(`\\bON\\s+(?:ONLY\\s+)?${identifier}(?:\\.${identifier})*(?:\\s+USING\\s+\\w+)?\\s*\\((.*)`, 'i')
  );
  if (!match) return undefined;
  const columns: string[] = [];
  let rest = match[1];
  while (rest) {
    const column = rest.match(
      /^\s*("(?:[^"]|"")*"|[\w$]+)(?:\s+(?:ASC|DESC))?(?:\s+NULLS\s+(?:FIRST|LAST))?\s*([,)])/i
    );
    if (!column) return undefined;
    columns.push(column[1].startsWith('"') ? column[1].slice(1, -1).replace(/""/g, '"') : column[1]);
    if (column[2] === ')') return columns;
    rest = rest.slice(column[0].length);
  }
  return undefined;
}

/** Extract the query from canonical catalog DDL without interpreting the query's SQL dialect. */
function viewStatement(sql: string): string {
  const identifier = '(?:"(?:[^"]|"")*"|[^\\s"().,]+)';
  const qualified = `${identifier}(?:\\.${identifier})*`;
  const columns = `(?:\\s*\\(\\s*(${identifier}(?:\\s*,\\s*${identifier})*)\\s*\\))?`;
  const match = sql.match(
    new RegExp(
      `^CREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:TEMP(?:ORARY)?\\s+)?VIEW\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${qualified}${columns}\\s+AS\\s+([\\s\\S]+)$`,
      'i'
    )
  );
  if (!match) throw new Error('Unsupported catalog view definition');
  const query = match[2].trim().replace(/;$/, '').trimEnd();
  return match[1] ? `SELECT * FROM (${query}) AS "__ava_view"(${match[1]})` : query;
}

type Metadata = Record<string, any>;
const bool = (value: unknown): boolean => value === true || value === 1 || value === '1';

/** Assemble models, keys and relationships from tagged catalog rows. */
export function rowObjects2Schema(rows: Record<string, unknown>[]): Schema {
  const models = new Map<string, Schema['models'][number]>();
  const columns = new Map<string, Metadata[]>();
  const keys = new Map<string, Metadata[]>();
  const parts = new Map<string, { table: string; kind: string; rows: Metadata[] }>();
  const foreignKeys: {
    name?: string;
    table: string;
    columns: string[];
    referencedTable: string;
    referencedColumns: string[];
  }[] = [];
  const views: NonNullable<Schema['views']> = [];

  const addKey = (table: string, metadata: Metadata) => keys.set(table, [...(keys.get(table) ?? []), metadata]);

  for (const row of rows) {
    const table = String(row.table_name);
    const meta: Metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    const model = models.get(table) ?? { name: table, tableReference: { table }, columns: [] };
    models.set(table, model);

    if (meta.catalog != null) model.tableReference.catalog = meta.catalog;
    if (meta.schema != null) model.tableReference.schema = meta.schema;

    if (row.kind === 'column') columns.set(table, [...(columns.get(table) ?? []), meta]);
    else if (row.kind === 'index' && bool(meta.unique)) {
      const names = meta.columns ?? indexColumns(meta.definition ?? '');
      if (names) addKey(table, { ...meta, columns: names });
    } else if (row.kind === 'foreign-key') foreignKeys.push({ ...meta, table } as (typeof foreignKeys)[number]);
    else if (row.kind === 'index-column' || row.kind === 'foreign-key-column') {
      const id = JSON.stringify([table, row.kind, meta.name]);
      const part = parts.get(id) ?? { table, kind: String(row.kind), rows: [] };
      part.rows.push(meta);
      parts.set(id, part);
    } else if (row.kind === 'view') {
      const statement = meta.statement ?? (meta.sql ? viewStatement(meta.sql) : undefined);
      if (statement) views.push({ name: table, statement });
    }
  }

  for (const { table, kind, rows } of parts.values()) {
    rows.sort((a, b) => Number(a.position) - Number(b.position));
    if (rows.some((row, i) => !row.column || Number(row.position) !== i + 1)) continue;

    const first = rows[0];
    if (kind === 'index-column' && bool(first.unique))
      addKey(table, { ...first, columns: rows.map((row) => row.column) });
    else if (kind === 'foreign-key-column')
      foreignKeys.push({
        name: first.name,
        table,
        columns: rows.map((row) => row.column),
        referencedTable: first.referencedTable,
        referencedColumns: rows.map((row) => row.referencedColumn),
      });
  }

  const validColumns = (table: string, names: string[]) =>
    Array.isArray(names) &&
    names.length > 0 &&
    new Set(names).size === names.length &&
    names.every((name) => models.get(table)?.columns.some((column) => column.name === name));
  const key = (names: string[]) => (names.length === 1 ? names[0] : (names as [string, ...string[]]));

  for (const model of models.values()) {
    model.columns = (columns.get(model.name) ?? [])
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((column) => ({
        name: column.name,
        type: column.type,
        ...(column.notNull == null ? {} : { notNull: bool(column.notNull) }),
      }));
  }

  for (const model of models.values()) {
    const declared = (keys.get(model.name) ?? []).filter((key) => validColumns(model.name, key.columns));
    const primary = declared.find((key) => bool(key.primary));
    if (primary) model.primaryKey = key(primary.columns);

    const alternatives = declared.filter((key) => !bool(key.primary));
    if (alternatives.length) model.uniqueKeys = alternatives.map((entry) => key(entry.columns));
  }

  const uniqueOn = (table: string, columns: string[]) => {
    const model = models.get(table);
    return (
      model &&
      [model.primaryKey, ...(model.uniqueKeys ?? [])].some(
        (key) =>
          key !== undefined && (typeof key === 'string' ? [key] : key).every((column) => columns.includes(column))
      )
    );
  };

  const relationships: NonNullable<Schema['relationships']> = [];
  const usedNames = new Set<string>();

  for (const fk of foreignKeys.sort(
    (a, b) => a.table.localeCompare(b.table) || (a.name ?? '').localeCompare(b.name ?? '')
  )) {
    if (
      !validColumns(fk.table, fk.columns) ||
      !validColumns(fk.referencedTable, fk.referencedColumns) ||
      fk.columns.length !== fk.referencedColumns.length ||
      !uniqueOn(fk.referencedTable, fk.referencedColumns)
    )
      continue;

    const base = fk.name ?? `fk:${JSON.stringify([fk.table, fk.columns, fk.referencedTable, fk.referencedColumns])}`;
    let name = base;
    for (let i = 2; usedNames.has(name); i += 1) name = `${base}_${i}`;
    usedNames.add(name);

    relationships.push({
      name,
      models: [fk.table, fk.referencedTable],
      joinType: uniqueOn(fk.table, fk.columns) ? 'ONE_TO_ONE' : 'MANY_TO_ONE',
      condition: fk.columns
        .map(
          (column, i) =>
            `${sqlIdentifier(fk.table)}.${sqlIdentifier(column)} = ${sqlIdentifier(fk.referencedTable)}.${sqlIdentifier(
              fk.referencedColumns[i]
            )}`
        )
        .join(' AND '),
    });
  }

  return schemaMetadataSchema.parse({
    models: [...models.values()].sort((a, b) => a.name.localeCompare(b.name)),
    relationships,
    views,
  });
}
