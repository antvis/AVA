import { describe, expect, it, vi } from 'vitest';

import { TSQLDialect } from '../../../src/query/tsql';
import { getSQLServerSchema } from '../../../src/remote/sqlserver/schema';

const dialect = new TSQLDialect({ model: 'unused' });

function catalogRow(kind: string, name: string, sourceTable: string, metadata: Record<string, unknown>) {
  return { kind, table_name: name, source_table: sourceTable, metadata: JSON.stringify(metadata) };
}

function viewRows(definition: string | null, names = ['value'], table = 'report') {
  const model = `[dbo].[${table}]`;
  return [
    catalogRow('view', model, table, { catalog: 'sales', schema: 'dbo', sql: definition }),
    ...names.map((name, index) =>
      catalogRow('column', model, table, {
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

  it('preserves explicit view column aliases instead of exposing the query expressions', async () => {
    const statement = await extractStatement(
      `CREATE VIEW "dbo"."report AS name" ([customer, name], [total AS ]] net]) AS
SELECT N'A' AS original_name, 3 AS original_total;`,
      ['customer, name', 'total AS ] net']
    );
    expect(statement).toContain('[customer, name]');
    expect(statement).toContain('[total AS ]] net]');
    expect(statement).toContain("N'A' AS original_name");
    expect(statement).toMatch(/\)\s+AS\s+(?:\[[^\]]+\]|"[^"]+"|\w+)\s*\(/i);
  });

  it.each([
    '-- definition changed\nALTER VIEW dbo.report AS SELECT 2 AS value;',
    'CREATE /* header */ OR /* header AS */ ALTER VIEW dbo.report AS SELECT 4 AS value;',
  ])('reads query definitions created or altered through supported DDL: %#', async (definition) => {
    const statement = await extractStatement(definition);
    expect(statement).toMatch(/^SELECT\s+[1-4]\s+AS\s+value\s*;?$/i);
  });

  it.each([null, 'CREATE VIEW "dbo"."report AS ""quoted" AS SELECT 1 AS value;'])(
    'keeps view metadata when its definition is unavailable or unsupported: %#',
    async (definition) => {
      const run = vi.fn().mockResolvedValue([
        ...viewRows(definition),
        ...viewRows('CREATE VIEW dbo.valid AS SELECT 2 AS value;', ['value'], 'valid'),
      ]);
      const schema = await getSQLServerSchema(run);
      expect(schema.models).toHaveLength(2);
      expect(schema.models[0]).toEqual({
        name: '[dbo].[report]',
        tableReference: { catalog: 'sales', schema: 'dbo', table: 'report' },
        columns: [{ name: 'value', type: 'int', notNull: false }],
      });
      expect(schema.views).toEqual([{ name: '[dbo].[valid]', statement: 'SELECT 2 AS value' }]);
    }
  );
});
