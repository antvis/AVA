import { describe, expect, it, vi } from 'vitest';

import { SQLServerQueryDialect } from '../../../src/query/sqlserver';
import { getSQLServerSchema } from '../../../src/remote/sqlserver/schema';

const dialect = new SQLServerQueryDialect({ model: 'unused' });

function catalogRow(kind: string, name: string, sourceTable: string, metadata: Record<string, unknown>) {
  return { kind, table_name: name, source_table: sourceTable, metadata: JSON.stringify(metadata) };
}

function viewRows(definition: string | null, names = ['value']) {
  return [
    catalogRow('view', '[dbo].[report]', 'report', { catalog: 'sales', schema: 'dbo', sql: definition }),
    ...names.map((name, index) =>
      catalogRow('column', '[dbo].[report]', 'report', {
        name,
        type: 'int',
        position: index + 1,
        notNull: false,
      })
    ),
  ];
}

async function extractStatement(definition: string, names?: string[]): Promise<string> {
  const schema = await getSQLServerSchema(vi.fn().mockResolvedValue(viewRows(definition, names)));
  expect(schema.views).toHaveLength(1);
  const statement = schema.views![0].statement;
  await expect(dialect.validateDSL(statement)).resolves.toBe(statement);
  expect(statement).not.toMatch(/^\s*(?:CREATE|ALTER)\b/i);
  return statement;
}

describe('SQL Server view schema', () => {
  it('discovers tables and views as physical models with ordered catalog columns', async () => {
    const run = vi.fn().mockResolvedValue([
      catalogRow('table', '[dbo].[orders]', 'orders', { catalog: 'sales', schema: 'dbo' }),
      catalogRow('column', '[dbo].[orders]', 'orders', { name: 'id', type: 'int', position: 1, notNull: 1 }),
      catalogRow('view', '[reporting].[paid orders]', 'paid orders', {
        catalog: 'sales',
        schema: 'reporting',
        sql: 'CREATE VIEW [reporting].[paid orders] AS SELECT id, amount FROM dbo.orders;',
      }),
      catalogRow('column', '[reporting].[paid orders]', 'paid orders', {
        name: 'amount',
        type: 'decimal(12,2)',
        position: 2,
        notNull: 0,
      }),
      catalogRow('column', '[reporting].[paid orders]', 'paid orders', {
        name: 'id',
        type: 'int',
        position: 1,
        notNull: 1,
      }),
    ]);

    const schema = await getSQLServerSchema(run);
    expect(schema.models).toEqual([
      {
        name: '[dbo].[orders]',
        tableReference: { catalog: 'sales', schema: 'dbo', table: 'orders' },
        columns: [{ name: 'id', type: 'int', notNull: true }],
      },
      {
        name: '[reporting].[paid orders]',
        tableReference: { catalog: 'sales', schema: 'reporting', table: 'paid orders' },
        columns: [
          { name: 'id', type: 'int', notNull: true },
          { name: 'amount', type: 'decimal(12,2)', notNull: false },
        ],
      },
    ]);
    expect(schema.relationships).toEqual([]);
    expect(schema.views).toHaveLength(1);
    expect(schema.views![0].name).toBe('[reporting].[paid orders]');
    expect(schema.views![0].statement.replace(/;\s*$/, '').trim()).toBe('SELECT id, amount FROM dbo.orders');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('extracts the query without confusing quoted names, AS literals or comments', async () => {
    const statement = await extractStatement(`/* header AS 😀 */
CREATE /* ignored AS */ VIEW [dbo].[sales AS ]] report] AS
SELECT N'AS ; -- 😀' AS [value] /* body AS comment */ WHERE 1 = 0;`);
    expect(statement).toContain("N'AS ; -- 😀' AS [value]");
    expect(statement).toContain('/* body AS comment */');
    expect(statement).toContain('WHERE 1 = 0');
    expect(statement).not.toContain('sales AS ]] report');
  });

  it('accepts double-quoted schema and view names containing spaces and AS', async () => {
    const statement = await extractStatement('CREATE VIEW "dbo"."report AS name" AS SELECT 1 AS "value";');
    expect(statement).toContain('SELECT 1 AS "value"');
  });

  it('preserves explicit view column aliases instead of exposing the query expressions', async () => {
    const statement = await extractStatement(
      `CREATE VIEW [dbo].[report] ([customer, name], [total AS ]] net]) AS
SELECT N'A' AS original_name, 3 AS original_total;`,
      ['customer, name', 'total AS ] net']
    );
    expect(statement).toContain('[customer, name]');
    expect(statement).toContain('[total AS ]] net]');
    expect(statement).toContain("N'A' AS original_name");
    expect(statement).toMatch(/\)\s+AS\s+(?:\[[^\]]+\]|"[^"]+"|\w+)\s*\(/i);
  });

  it('keeps CTEs outside the derived query when applying explicit column aliases', async () => {
    const statement = await extractStatement(
      `CREATE VIEW dbo.report ([customer], [total]) AS
WITH totals AS (
  SELECT customer_id, SUM(amount) AS amount FROM dbo.orders GROUP BY customer_id
)
SELECT customer_id, amount FROM totals;`,
      ['customer', 'total']
    );
    expect(statement.trim()).toMatch(/^WITH\s+totals\s+AS\s*\(/i);
    expect(statement).toContain('SUM(amount) AS amount');
    expect(statement).toContain('[customer]');
    expect(statement).toContain('[total]');
    expect(statement).not.toMatch(/FROM\s*\(\s*WITH\b/i);
  });

  it('separates view attributes and CHECK OPTION from a CTE query', async () => {
    const statement = await extractStatement(`CREATE VIEW dbo.report
WITH SCHEMABINDING, VIEW_METADATA AS -- AS SELECT is a header comment
WITH selected AS (SELECT id FROM dbo.orders)
SELECT id AS [value] FROM selected WHERE id > 0 WITH CHECK OPTION;`);
    expect(statement.trim()).toMatch(/^WITH\s+selected\s+AS\s*\(/i);
    expect(statement).toContain('SELECT id AS [value] FROM selected WHERE id > 0');
    expect(statement).not.toMatch(/\bSCHEMABINDING\b|\bVIEW_METADATA\b|\bWITH\s+CHECK\s+OPTION\b/i);
  });

  it.each([
    'CREATE VIEW dbo.report AS SELECT 1 AS value;',
    '-- definition changed\nALTER VIEW dbo.report AS SELECT 2 AS value;',
    'CREATE OR ALTER VIEW dbo.report AS SELECT 3 AS value;',
    'CREATE /* header */ OR /* header AS */ ALTER VIEW dbo.report AS SELECT 4 AS value;',
  ])('reads query definitions created or altered through supported DDL: %#', async (definition) => {
    const statement = await extractStatement(definition);
    expect(statement).toMatch(/^SELECT\s+[1-4]\s+AS\s+value\s*;?$/i);
  });

  it('keeps readable views and their columns when definition text is unavailable', async () => {
    const schema = await getSQLServerSchema(vi.fn().mockResolvedValue(viewRows(null)));
    expect(schema).toEqual({
      models: [
        {
          name: '[dbo].[report]',
          tableReference: { catalog: 'sales', schema: 'dbo', table: 'report' },
          columns: [{ name: 'value', type: 'int', notNull: false }],
        },
      ],
      relationships: [],
      views: [],
    });
  });

  it('keeps readable views when an older grammar cannot extract their definition', async () => {
    const run = vi.fn().mockResolvedValue([
      catalogRow('view', '[dbo].[report AS "quoted]', 'report AS "quoted', {
        catalog: 'sales',
        schema: 'dbo',
        sql: 'CREATE VIEW "dbo"."report AS ""quoted" AS SELECT 1 AS value;',
      }),
      catalogRow('column', '[dbo].[report AS "quoted]', 'report AS "quoted', {
        name: 'value',
        type: 'int',
        position: 1,
        notNull: false,
      }),
      ...viewRows('CREATE VIEW dbo.report AS SELECT 2 AS value;'),
    ]);
    const schema = await getSQLServerSchema(run);
    expect(schema.models).toEqual(
      expect.arrayContaining([
        {
          name: '[dbo].[report AS "quoted]',
          tableReference: { catalog: 'sales', schema: 'dbo', table: 'report AS "quoted' },
          columns: [{ name: 'value', type: 'int', notNull: false }],
        },
      ])
    );
    expect(schema.models).toHaveLength(2);
    expect(schema.views).toHaveLength(1);
    expect(schema.views![0].name).toBe('[dbo].[report]');
    expect(schema.views![0].statement).toContain('SELECT 2 AS value');
  });

  it('retains the namespace, non-system and SELECT-permission filters for both relation kinds', async () => {
    const run = vi.fn().mockResolvedValue([]);
    expect(await getSQLServerSchema(run, "report'ing")).toEqual({ models: [], relationships: [], views: [] });
    expect(run).toHaveBeenCalledTimes(1);
    const query = run.mock.calls[0][0];
    expect(query).toContain("N'report''ing'");
    expect(query).toMatch(/\bis_ms_shipped\s*=\s*0/i);
    expect(query).toMatch(/HAS_PERMS_BY_NAME\s*\(/i);
    expect(query).toMatch(/'OBJECT'\s*,\s*'SELECT'/i);
    expect(query).toMatch(/sys\.views|['"]V['"]/i);
    expect(query).toMatch(/sys\.tables|['"]U['"]/i);
    expect(query).toMatch(/sys\.sql_modules|OBJECT_DEFINITION\s*\(/i);
    expect(query).toMatch(/sys\.columns/i);
    await expect(dialect.validateDSL(query)).resolves.toBe(query);
  });

  it('propagates catalog failures without returning a partial schema', async () => {
    const error = new Error('catalog unavailable');
    await expect(getSQLServerSchema(vi.fn().mockRejectedValue(error))).rejects.toBe(error);
  });
});
