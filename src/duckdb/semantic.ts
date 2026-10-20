import { sqlStringLiteral } from '../util/sql';

import type { DuckDBConnection } from '@duckdb/node-api';
import type { Schema } from '../types';

// DuckDB's serialized parse tree is engine-owned and versioned with our DuckDB dependency.
type Node = { [key: string]: any };
type Columns = Map<string, string>;
type Source = { table?: string; columns: Columns | null };
type Scope = { sources: Map<string, Source>; aliases: Map<string, Node>; parent?: Scope };
type Evidence = Map<string, Set<string>>;
const lower = (name: string) => name.toLowerCase();

async function parse(connection: DuckDBConnection, sql: string): Promise<Node> {
  const rows = (await connection.runAndReadAll(`SELECT json_serialize_sql(${sqlStringLiteral(sql)})`)).getRows();
  const result = JSON.parse(String(rows[0][0]));
  if (result.error) throw new Error(`Cannot parse semantic SQL: ${result.error_message}`);
  if (result.statements?.length !== 1) throw new Error('Semantic SQL requires exactly one SELECT statement');
  return result.statements[0].node;
}

/** Resolve physical reads with SQL scopes, including CTEs, correlated subqueries and column aliases. */
function inspect(root: Node, schema: Schema, allowed?: Evidence): Evidence {
  const reads: Evidence = new Map();
  const tables = schema.tables.map((table) => ({
    name: lower(table.name),
    columns: new Map(table.fields.map((field) => [lower(field.name), lower(field.name)])),
  }));

  function read(source: Source, column?: string) {
    if (!source.table) return;
    const columns = reads.get(source.table) ?? new Set<string>();
    reads.set(source.table, columns);
    if (allowed && !allowed.has(source.table))
      throw new Error(`Table not introduced by successful SMQs: ${source.table}`);
    if (column !== undefined) {
      if (allowed && !allowed.get(source.table)!.has(column)) {
        throw new Error(`Column not introduced by successful SMQs: ${source.table}.${column}`);
      }
      columns.add(column);
    }
  }

  function column(names: string[], scope: Scope, resolving = new Set<string>(), ctes = new Map<string, Source>()) {
    const parts = names.map(lower);
    for (let current: Scope | undefined = scope; current; current = current.parent) {
      if (parts.length > 1) {
        for (let size = parts.length - 1; size > 0; size--) {
          const source = current.sources.get(parts.slice(0, size).join('.'));
          if (!source) continue;
          const physical = source.columns?.get(parts[size]);
          if (source.columns && physical === undefined) throw new Error(`Unknown grounded column: ${names.join('.')}`);
          read(source, physical);
          return;
        }
      }
      const sources = [...new Set(current.sources.values())];
      const matches = sources.filter((source) => source.columns?.has(parts[0]));
      if (matches.length > 0) {
        for (const source of matches) read(source, source.columns!.get(parts[0]));
        return;
      }
      const alias = current.aliases.get(parts[0]);
      if (alias) {
        if (resolving.has(parts[0])) throw new Error(`Circular SQL alias: ${parts[0]}`);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        expression(alias, current, new Set([...resolving, parts[0]]), ctes);
        return;
      }
      if (current.sources.has(parts[0])) throw new Error('Select explicit columns instead of a whole-row reference');
    }
    throw new Error(`Column not introduced by successful SMQs: ${names.join('.')}`);
  }

  function expression(value: unknown, scope: Scope, resolving = new Set<string>(), ctes = new Map<string, Source>()) {
    if (Array.isArray(value)) {
      value.forEach((item) => expression(item, scope, resolving, ctes));
      return;
    }
    if (!value || typeof value !== 'object') return;
    const node = value as Node;
    if (node.class === 'COLUMN_REF') {
      column(node.column_names, scope, resolving, ctes);
      return;
    }
    if (node.class === 'STAR') {
      if (node.columns || node.exclude_list?.length || node.replace_list?.length || node.rename_list?.length) {
        throw new Error('Use explicit grounded columns instead of dynamic star expressions');
      }
      const sources = node.relation_name
        ? [scope.sources.get(lower(node.relation_name))]
        : [...new Set(scope.sources.values())];
      for (const source of sources) {
        if (!source) throw new Error('Unknown relation in star expression');
        if (source.table) for (const field of source.columns!.values()) read(source, field);
      }
      return;
    }
    if (node.node?.type?.endsWith('_NODE')) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      query(node.node, ctes, scope);
      return;
    }
    for (const child of Object.values(node)) expression(child, scope, resolving, ctes);
  }

  function query(node: Node, inherited: Map<string, Source>, parent?: Scope): Source {
    const ctes = new Map(inherited);
    for (const entry of node.cte_map?.map ?? []) {
      const aliases: string[] = entry.value.aliases ?? [];
      const source = query(entry.value.query.node, ctes, parent);
      ctes.set(
        lower(entry.key),
        aliases.length ? { columns: new Map(aliases.map((name) => [lower(name), lower(name)])) } : source
      );
    }
    if (node.type === 'SET_OPERATION_NODE' || node.type === 'RECURSIVE_CTE_NODE') {
      const left = query(node.left, ctes, parent);
      if (node.type === 'RECURSIVE_CTE_NODE') {
        // Recursive references inherit the anchor's column names unless explicitly renamed.
        const aliases: string[] = node.aliases ?? [];
        ctes.set(
          lower(node.cte_name),
          aliases.length ? { columns: new Map(aliases.map((name) => [lower(name), lower(name)])) } : left
        );
      }
      query(node.right, ctes, parent);
      expression(node.modifiers, { sources: new Map([['result', left]]), aliases: new Map(), parent }, new Set(), ctes);
      return left;
    }
    if (node.type !== 'SELECT_NODE') throw new Error(`Unsupported semantic query node: ${node.type}`);
    const scope: Scope = { sources: new Map(), aliases: new Map(), parent };
    const conditions: unknown[] = [];
    function source(ref: Node): void {
      if (!ref || ref.type === 'EMPTY') return;
      if (ref.type === 'JOIN') {
        if (ref.alias || ref.ref_type === 'NATURAL') throw new Error('Use explicit joins for semantic SQL');
        source(ref.left);
        source(ref.right);
        conditions.push(ref.condition);
        for (const name of ref.using_columns ?? []) column([name], scope);
        return;
      }
      let binding: Source;
      let name = ref.alias;
      if (ref.type === 'BASE_TABLE') {
        const full = [ref.catalog_name, ref.schema_name, ref.table_name].filter(Boolean).join('.');
        binding = !ref.catalog_name && !ref.schema_name ? ctes.get(lower(ref.table_name)) : undefined;
        if (!binding) {
          const exact = tables.filter((table) => table.name === lower(full));
          const candidates = exact.length
            ? exact
            : !ref.catalog_name && (!ref.schema_name || ref.schema_name === 'main')
            ? tables.filter((table) =>
                ref.schema_name ? table.name === lower(ref.table_name) : table.name.split('.').pop() === lower(full)
              )
            : [];
          if (candidates.length !== 1) throw new Error(`Unknown or ambiguous physical table: ${full}`);
          binding = { table: candidates[0].name, columns: candidates[0].columns };
          read(binding);
        }
        if (!name) {
          scope.sources.set(lower(full), binding);
          name = ref.table_name;
        }
      } else if (ref.type === 'SUBQUERY') {
        binding = query(ref.subquery.node, ctes, scope);
      } else if (ref.type === 'EXPRESSION_LIST') {
        expression(ref.values, scope, new Set(), ctes);
        binding = { columns: null };
      } else if (ref.type === 'TABLE_FUNCTION') {
        // Only local relational expansion is supported; no catalog or external reader functions.
        if (!['unnest', 'range', 'generate_series'].includes(lower(ref.function.function_name))) {
          throw new Error(`Unsupported semantic table function: ${ref.function.function_name}`);
        }
        expression(ref.function, scope, new Set(), ctes);
        binding = { columns: null };
      } else {
        throw new Error(`Unsupported semantic table reference: ${ref.type}`);
      }
      if (ref.column_name_alias?.length) {
        const physical = binding.columns ? [...binding.columns.values()] : [];
        binding = {
          ...binding,
          columns: new Map(
            ref.column_name_alias.map((alias: string, index: number) => [lower(alias), physical[index] ?? lower(alias)])
          ),
        };
      }
      scope.sources.set(lower(name || `derived_${scope.sources.size}`), binding);
    }
    source(node.from_table);
    for (const item of node.select_list) if (item.alias) scope.aliases.set(lower(item.alias), item);
    for (const [key, value] of Object.entries(node)) {
      if (key !== 'from_table' && key !== 'cte_map') expression(value, scope, new Set(), ctes);
    }
    expression(conditions, scope, new Set(), ctes);
    const outputs = new Map<string, string>();
    for (const item of node.select_list) {
      if (item.alias || item.class === 'COLUMN_REF') {
        const name = lower(item.alias || item.column_names[item.column_names.length - 1]);
        outputs.set(name, name);
      } else if (item.class === 'STAR') {
        const sources = item.relation_name
          ? [scope.sources.get(lower(item.relation_name))]
          : [...scope.sources.values()];
        for (const entry of sources) for (const name of entry?.columns?.keys() ?? []) outputs.set(name, name);
      }
    }
    return { columns: outputs };
  }
  query(root, new Map());
  return reads;
}

/** Ground physical reads and bind the final query without executing it. */
export async function validateSemanticQuery(
  connection: DuckDBConnection,
  sql: string,
  fragments: readonly string[],
  schema: Schema
): Promise<void> {
  const allowed: Evidence = new Map();
  for (const fragment of fragments) {
    for (const [table, columns] of inspect(await parse(connection, fragment), schema)) {
      const known = allowed.get(table) ?? new Set<string>();
      for (const name of columns) known.add(name);
      allowed.set(table, known);
    }
  }
  const reads = inspect(await parse(connection, sql), schema, allowed);
  if (reads.size === 0) throw new Error('Compute the answer from grounded data, not literal preview values.');
  await connection.run(`EXPLAIN ${sql}`);
}
