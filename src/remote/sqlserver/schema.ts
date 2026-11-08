import { loadTSQLParser } from '../../query/tsql';
import { rowObjects2Schema } from '../../util/schema';
import { sqlIdentifier, sqlStringLiteral, sqlUnionAll } from '../../util/sql';

import type { CommonTokenStream, ParserRuleContext } from 'antlr4ts';
import type { Schema } from '../../contracts/schema';

function exposedSQL(schema?: string): string {
  const filter = schema === undefined ? '' : `AND s.name = N${sqlStringLiteral(schema)}`;
  return `SELECT t.object_id, s.name AS schema_name, t.name AS source_table,
  t.object_type, QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) AS model_name
FROM (
  SELECT object_id, schema_id, name, is_ms_shipped, 'U' AS object_type FROM sys.tables
  UNION ALL
  SELECT object_id, schema_id, name, is_ms_shipped, 'V' AS object_type FROM sys.views
) AS t
JOIN sys.schemas AS s ON s.schema_id = t.schema_id
WHERE t.is_ms_shipped = 0
  ${filter}
  AND HAS_PERMS_BY_NAME(QUOTENAME(s.name) + N'.' + QUOTENAME(t.name), 'OBJECT', 'SELECT') = 1`;
}

const tablesSQL = `SELECT 'table' AS kind, e.model_name AS table_name, e.source_table,
  (SELECT DB_NAME() AS catalog, e.schema_name AS [schema]
   FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS metadata
FROM exposed AS e`;

const viewsSQL = `SELECT 'view' AS kind, e.model_name AS table_name, e.source_table,
  (SELECT m.definition AS sql FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS metadata
FROM exposed AS e
JOIN sys.sql_modules AS m ON m.object_id = e.object_id
WHERE e.object_type = 'V'`;

const columnsSQL = `SELECT 'column' AS kind, e.model_name AS table_name, e.source_table,
  (SELECT c.name AS name, c.column_id AS position,
    1 - CONVERT(int, c.is_nullable) AS notNull,
    CASE
      WHEN ty.name IN ('decimal', 'numeric') THEN CONCAT(ty.name, '(', c.precision, ',', c.scale, ')')
      WHEN ty.name IN ('datetime2', 'datetimeoffset', 'time') THEN CONCAT(ty.name, '(', c.scale, ')')
      WHEN ty.name IN ('varchar', 'char', 'nvarchar', 'nchar', 'varbinary', 'binary') THEN
        CONCAT(ty.name, '(', CASE WHEN c.max_length = -1 THEN 'max'
          ELSE CONVERT(varchar(10), c.max_length / CASE WHEN ty.name LIKE 'n%' THEN 2 ELSE 1 END) END, ')')
      ELSE ty.name
    END AS type
   FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS metadata
FROM exposed AS e
JOIN sys.columns AS c ON c.object_id = e.object_id
JOIN sys.types AS ty ON ty.user_type_id = c.user_type_id`;

const indexesSQL = `SELECT 'index-column' AS kind, e.model_name AS table_name, e.source_table,
  (SELECT i.name AS name, c.name AS [column], ic.key_ordinal AS position,
    1 AS [unique], i.is_primary_key AS [primary]
   FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS metadata
FROM exposed AS e
JOIN sys.indexes AS i ON i.object_id = e.object_id
JOIN sys.index_columns AS ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.columns AS c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE i.is_unique = 1 AND i.is_disabled = 0 AND i.has_filter = 0
  AND i.is_hypothetical = 0 AND ic.key_ordinal > 0`;

const foreignKeysSQL = `SELECT 'foreign-key-column' AS kind, e.model_name AS table_name, e.source_table,
  (SELECT fk.name AS name, c.name AS [column], fkc.constraint_column_id AS position,
    re.model_name AS referencedTable, rc.name AS referencedColumn
   FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS metadata
FROM sys.foreign_keys AS fk
JOIN exposed AS e ON e.object_id = fk.parent_object_id
JOIN exposed AS re ON re.object_id = fk.referenced_object_id
JOIN sys.foreign_key_columns AS fkc ON fkc.constraint_object_id = fk.object_id
JOIN sys.columns AS c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
JOIN sys.columns AS rc ON rc.object_id = fkc.referenced_object_id AND rc.column_id = fkc.referenced_column_id
WHERE fk.is_disabled = 0 AND fk.is_not_trusted = 0`;

/** Extract a query from SQL Server DDL without treating CREATE/ALTER as executable analysis SQL. */
async function viewStatement(sql: string): Promise<string | undefined> {
  try {
    const { createTSQLParser, CommonToken, CommonTokenStream, ListTokenSource, Token, TSqlParser } =
      await loadTSQLParser();
    const parser = createTSQLParser(sql, () => {
      throw new Error('Unsupported SQL Server view definition');
    });
    const stream = parser.inputStream as CommonTokenStream;
    stream.fill();
    let tokens = stream.getTokens();
    const header = tokens.filter((token) => token.channel === Token.DEFAULT_CHANNEL);
    const grammar = TSqlParser;
    // The bundled grammar predates ALTER VIEW and CREATE OR ALTER VIEW. Normalize only DDL tokens.
    if (header[0]?.type === grammar.ALTER) {
      const create = CommonToken.fromToken(header[0]);
      create.type = grammar.CREATE;
      tokens = tokens.map((token) => (token === header[0] ? create : token));
    } else if (
      header[0]?.type === grammar.CREATE &&
      header[1]?.type === grammar.OR &&
      header[2]?.type === grammar.ALTER
    ) {
      tokens = tokens.filter((token) => token !== header[1] && token !== header[2]);
    }
    parser.inputStream = new CommonTokenStream(new ListTokenSource(tokens));
    const view = parser.create_view();
    if (parser.currentToken.type !== Token.EOF) return undefined;
    // CaseChangingStream does not expose token text reliably; preserve the original source slices.
    const text = (context: ParserRuleContext) =>
      sql
        .slice(context.start.startIndex, context.stop!.stopIndex + 1)
        .trim()
        .replace(/;$/, '')
        .trimEnd();
    const query = view.select_statement_standalone();
    const aliases = view.column_name_list()?.id();
    if (!aliases?.length) return text(query);
    const cte = query.with_expression();
    return `${cte ? `${text(cte)}\n` : ''}SELECT * FROM (\n${text(
      query.select_statement()
    )}\n) AS [__ava_view](${aliases.map(text).join(', ')})`;
  } catch {
    // A newer T-SQL construct must not hide a readable view or prevent discovery of other objects.
    return undefined;
  }
}

/** Read tables, views, columns and keys through the shared catalog assembler. */
export async function getSQLServerSchema(
  runQuery: (sql: string) => Promise<Record<string, unknown>[]>,
  sourceSchema?: string
): Promise<Schema> {
  const rows = await runQuery(
    `WITH exposed AS (\n${exposedSQL(sourceSchema)}\n)\n${sqlUnionAll([
      tablesSQL,
      viewsSQL,
      columnsSQL,
      indexesSQL,
      foreignKeysSQL,
    ])}`
  );
  for (const row of rows) {
    if (row.kind !== 'view') continue;
    const { sql, ...metadata } = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    row.metadata = { ...metadata, statement: typeof sql === 'string' ? await viewStatement(sql) : undefined };
  }
  const schema = rowObjects2Schema(rows);
  for (const model of schema.models) {
    model.tableReference.table = String(rows.find((row) => row.table_name === model.name)!.source_table);
  }
  // The assembler quotes logical names as one identifier; T-SQL needs the schema/table pair.
  for (const relationship of schema.relationships ?? []) {
    for (const model of relationship.models) {
      relationship.condition = relationship.condition.split(`${sqlIdentifier(model)}.`).join(`${model}.`);
    }
  }
  return schema;
}
