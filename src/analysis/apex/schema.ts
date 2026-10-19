import { z } from 'zod/v4';

import { estimateTokens } from './runtime';

import type { Schema, TableSchema } from '../../types';

export const columnSelection = z.object({ columns: z.array(z.object({ table: z.string(), column: z.string() })) });
export type ColumnRef = z.infer<typeof columnSelection>['columns'][number];
const key = ({ table, column }: ColumnRef) => JSON.stringify([table, column]);

export function columns(schema: Schema): ColumnRef[] {
  return schema.tables.flatMap((table) => table.fields.map((field) => ({ table: table.name, column: field.name })));
}

export function validateColumns(schema: Schema, selection: ColumnRef[]): ColumnRef[] {
  const known = new Set(columns(schema).map(key));
  for (const column of selection) {
    if (!known.has(key(column))) throw new Error(`APEX selected unknown column ${key(column)}`);
  }
  return [...new Map(selection.map((column) => [key(column), column])).values()];
}

export function selectSchema(schema: Schema, selected: ColumnRef[]): Schema {
  const retained = new Set(validateColumns(schema, selected).map(key));
  const tables = schema.tables
    .map((table) => {
      const fields = table.fields.filter((field) => retained.has(key({ table: table.name, column: field.name })));
      return {
        ...table,
        fields,
        columnCount: fields.length,
        indexes: table.indexes.filter((index) =>
          index.columns.every((column) => retained.has(key({ table: table.name, column })))
        ),
      };
    })
    .filter((table) => table.fields.length);
  const relations = (schema.relations ?? []).filter((relation) =>
    [relation.from, relation.to].every((end) =>
      end.columns.every((column) => retained.has(key({ table: end.table, column })))
    )
  );
  return { tables, relations };
}

export function prune(schema: Schema, removed: ColumnRef[], kept: ColumnRef[]): Schema {
  const deleted = new Set(validateColumns(schema, removed).map(key));
  const rescued = new Set(validateColumns(schema, kept).map(key));
  return selectSchema(
    schema,
    columns(schema).filter((column) => !deleted.has(key(column)) || rescued.has(key(column)))
  );
}

/** Restore declared shortest join paths, including every column of composite keys. */
export function connectSchema(full: Schema, selected: ColumnRef[]): Schema {
  const retained = validateColumns(full, selected);
  const names = [...new Set(retained.map(({ table }) => table))];
  const known = new Set(columns(full).map(key));
  const relations = (full.relations ?? []).filter(
    (relation) =>
      relation.from.columns.length > 0 &&
      relation.from.columns.length === relation.to.columns.length &&
      [relation.from, relation.to].every((end) =>
        end.columns.every((column) => known.has(key({ table: end.table, column })))
      )
  );
  const connected = new Set(names.slice(0, 1));
  for (const target of names.slice(1)) {
    const pending = [...connected].map((table) => ({ table, path: [] as typeof relations }));
    const visited = new Set(connected);
    for (let i = 0; i < pending.length; i++) {
      const current = pending[i];
      if (current.table === target) {
        for (const relation of current.path)
          for (const end of [relation.from, relation.to]) {
            connected.add(end.table);
            retained.push(...end.columns.map((column) => ({ table: end.table, column })));
          }
        break;
      }
      for (const relation of relations) {
        const next =
          relation.from.table === current.table
            ? relation.to.table
            : relation.to.table === current.table
            ? relation.from.table
            : undefined;
        if (next && !visited.has(next)) {
          visited.add(next);
          pending.push({ table: next, path: [...current.path, relation] });
        }
      }
    }
    connected.add(target);
  }
  return selectSchema(full, retained);
}

/** Batch by table; only exceptionally wide tables need column chunks. */
export function schemaBatches(schema: Schema, budget = 10000): Schema[] {
  const batches: Schema[] = [];
  let tables: TableSchema[] = [];
  let size = 0;
  for (const table of schema.tables) {
    const cost = estimateTokens(table);
    if (cost > budget) {
      if (tables.length) batches.push({ tables, relations: schema.relations });
      tables = [];
      size = 0;
      let fields: TableSchema['fields'] = [];
      for (const field of table.fields) {
        const next = { ...table, fields: [...fields, field] };
        if (estimateTokens(next) > budget && fields.length) {
          batches.push({ tables: [{ ...table, fields, columnCount: fields.length }] });
          fields = [];
        }
        fields.push(field);
      }
      if (fields.length) batches.push({ tables: [{ ...table, fields, columnCount: fields.length }] });
    } else {
      if (size + cost > budget && tables.length) {
        batches.push({ tables, relations: schema.relations });
        tables = [];
        size = 0;
      }
      tables.push(table);
      size += cost;
    }
  }
  if (tables.length) batches.push({ tables, relations: schema.relations });
  return batches;
}
