import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { SQLSERVER_LANGUAGE_INSTRUCTIONS, SQLServerQueryDialect } from '../../../src/query/sqlserver';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../../src/util/model', () => ({ languageModel: vi.fn(() => 'test-model') }));

const dialect = new SQLServerQueryDialect({ model: 'test' });
afterEach(() => vi.clearAllMocks());

describe('SQL Server read-only validation', () => {
  it.each([
    ['TOP and quoted identifiers', 'SELECT DISTINCT TOP (2) [order_id] AS [order id] FROM [dbo].[orders] ORDER BY order_id;'],
    ['CTE, joins and aggregates', 'WITH paid AS (SELECT * FROM dbo.orders WHERE status=N\'paid\') SELECT c.customer_name, ISNULL(SUM(p.amount),0) AS total FROM dbo.customers c LEFT JOIN paid p ON c.customer_id=p.customer_id GROUP BY c.customer_name'],
    ['UNION and subqueries', 'SELECT n FROM (SELECT 1 AS n) q UNION ALL SELECT 2 AS n UNION SELECT 3 AS n'],
    ['pagination', 'SELECT order_id FROM dbo.orders ORDER BY order_id OFFSET 2 ROWS FETCH NEXT 2 ROWS ONLY'],
    ['literal escapes and backslashes', "SELECT N'张三; it''s -- /* text */' AS value, 'C:\\' AS path; -- trailing comment"],
    ['remote-query keywords in literals and quoted names', "SELECT N'OPENQUERY OPENROWSET' AS [OPENROWSET]"],
  ])('accepts and preserves %s', async (_, sql) => {
    await expect(dialect.validateDSL(sql)).resolves.toBe(sql);
  });

  it.each([
    ['empty SQL', ''],
    ['DML', 'DELETE FROM dbo.orders'],
    ['DDL', 'DROP TABLE dbo.orders'],
    ['multiple statements', 'SELECT 1; SELECT 2'],
    ['GO batches', 'SELECT 1\nGO\nSELECT 2'],
    ['SELECT INTO in a UNION arm', 'WITH q AS (SELECT 1 AS n) SELECT n FROM q UNION ALL SELECT 2 INTO dbo.copy'],
    ['OPENQUERY', "SELECT * FROM OPENQUERY([linked_server], 'EXEC db.dbo.mutate_and_return_rows')"],
    ['OPENROWSET', "SELECT * FROM OPENROWSET('MSOLEDBSQL', 'Server=example;Trusted_Connection=yes;', 'EXEC db.dbo.mutate_and_return_rows')"],
    ['nested OPENROWSET', "WITH remote_rows AS (SELECT * FROM OPENROWSET('MSOLEDBSQL', 'Server=example;Trusted_Connection=yes;', 'EXEC db.dbo.mutate_and_return_rows')) SELECT * FROM remote_rows"],
    ['unterminated strings', "SELECT 'unterminated"],
  ])('rejects %s', async (_, sql) => {
    await expect(dialect.validateDSL(sql)).rejects.toThrow('read-only SELECT');
  });
});

describe('SQL Server query generation', () => {
  it('removes surrounding SQL fences while preserving embedded literals', async () => {
    vi.mocked(generateText).mockResolvedValue({ text: "```tsql\r\nSELECT '```' AS value\r\n```", usage: {} } as never);
    await expect(dialect.getDSL('question', { models: [] })).resolves.toBe("SELECT '```' AS value");
  });

  it('shares SQL Server instructions and forwards model context and usage', async () => {
    const onQueryUsage = vi.fn();
    const usage = { totalTokens: 12 };
    vi.mocked(generateText).mockResolvedValue({ text: 'SELECT 1', usage } as never);
    await new SQLServerQueryDialect({ model: 'test', maxRetries: 0, onQueryUsage }).getDSL('sales by month', {
      models: [{ name: 'orders', columns: [{ name: 'amount', type: 'decimal(12,2)' }] }],
    });
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({ maxRetries: 0, prompt: expect.stringContaining(SQLSERVER_LANGUAGE_INSTRUCTIONS) })
    );
    const prompt = vi.mocked(generateText).mock.calls[0][0].prompt;
    expect(prompt).toContain('orders');
    expect(prompt).toContain('sales by month');
    expect(prompt).toContain('instead of LIMIT');
    expect(onQueryUsage).toHaveBeenCalledWith(usage);
  });

  it('uses the default retry count and propagates model failures', async () => {
    vi.mocked(generateText).mockRejectedValueOnce(new Error('model unavailable'));
    await expect(dialect.getDSL('question', { models: [] })).rejects.toThrow('model unavailable');
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({ maxRetries: 3 }));
  });
});
