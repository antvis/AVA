import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { loadTSQLParser, TSQLDialect } from '../../src/query/tsql';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../src/util/model', () => ({ languageModel: vi.fn(() => 'test-model') }));
const parserState = vi.hoisted(() => ({ loads: 0 }));
vi.mock('antlr4ts-sql/dist/src/grammar-output/tsql/TSqlParser.js', async (importOriginal) => {
  parserState.loads += 1;
  return importOriginal();
});

afterEach(() => vi.clearAllMocks());

const dialect = new TSQLDialect({ model: 'test' });

describe('T-SQL validation', () => {
  it('loads the grammar only when validating SQL', async () => {
    vi.mocked(generateText).mockResolvedValue({ text: 'SELECT 1', finishReason: 'stop' } as never);
    expect(parserState.loads).toBe(0);
    expect((await dialect.getDSL('one', { models: [] })).dsl).toBe('SELECT 1');
    expect(parserState.loads).toBe(0);
    await dialect.validateDSL('SELECT 1');
    expect(parserState.loads).toBe(1);
  });

  it.each([
    "/* 中文😀 */ SELECT DISTINCT TOP (2) N'it''s; OPENQUERY OPENROWSET' AS [OPENROWSET] FROM [dbo].[orders] ORDER BY [order_id]",
    "WITH paid AS (SELECT * FROM dbo.orders WHERE status=N'paid') SELECT c.customer_name, SUM(p.amount) AS total FROM dbo.customers c JOIN paid p ON c.customer_id=p.customer_id GROUP BY c.customer_name",
    'SELECT n FROM (SELECT 1 AS n) q UNION ALL SELECT 2 AS n UNION SELECT 3 AS n',
    'SELECT order_id FROM dbo.orders ORDER BY order_id OFFSET 2 ROWS FETCH NEXT 2 ROWS ONLY',
    'SELECT 1 -- trailing line comment',
  ])('preserves source semantics and comments while removing the terminator: %s', async (sql) => {
    const normalized = await dialect.validateDSL(`${sql}\n; -- trailing statement comment`);
    expect(normalized).toBe(sql);
    // SQL Server limits rows by prefixing the SELECT rather than wrapping it in a subquery.
    const { createTSQLParser, Token } = await loadTSQLParser();
    const parser = createTSQLParser(`SET ROWCOUNT 3;\n${normalized}`, () => {
      throw new Error('Invalid bounded T-SQL');
    });
    parser.tsql_file();
    expect(parser.currentToken.type).toBe(Token.EOF);
  });

  it.each([
    '',
    'DELETE FROM dbo.orders',
    'SELECT 1; SELECT 2',
    'SELECT 1\nGO\nSELECT 2',
    'WITH q AS (SELECT 1 AS n) SELECT n FROM q UNION ALL SELECT 2 INTO dbo.copy',
    "SELECT * FROM OPENQUERY([linked_server], 'EXEC db.dbo.mutate_and_return_rows')",
    "WITH q AS (SELECT * FROM OPENROWSET('MSOLEDBSQL', 'Server=example;', 'EXEC db.dbo.mutate_and_return_rows')) SELECT * FROM q",
    "SELECT 'unterminated",
  ])('rejects invalid, mutating or remote SQL throughout the tree: %s', async (sql) => {
    await expect(dialect.validateDSL(sql)).rejects.toThrow('read-only SELECT');
  });
});

describe('T-SQL generation', () => {
  it('extracts SQL and preserves usage and model context', async () => {
    const sql = "SELECT N'```' AS value";
    const usage = { inputTokens: 10, outputTokens: 5, totalTokens: 15 };
    vi.mocked(generateText).mockResolvedValue({ text: `\`\`\`tsql\n${sql}\n\`\`\``, usage, finishReason: 'stop' } as never);
    const result = await new TSQLDialect({ model: 'test', maxRetries: 0 }).getDSL('count orders', {
      models: [{ name: 'orders', columns: [], metrics: { row_count: 42 } }],
    });
    expect(result).toEqual({ dsl: sql, usage });
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({ maxRetries: 0, prompt: expect.stringContaining('orders') })
    );
    const prompt = vi.mocked(generateText).mock.calls[0][0].prompt;
    expect(prompt).toContain('42');
    expect(prompt).toContain('count orders');
    expect(prompt).toContain('TOP (n)');
  });

  it.each([
    { text: 'SELECT 1', finishReason: 'length', error: 'did not complete' },
    { text: '```sql\n\n```', finishReason: 'stop', error: 'empty query' },
  ])('rejects unusable generation: $error', async ({ text, finishReason, error }) => {
    vi.mocked(generateText).mockResolvedValue({ text, finishReason } as never);
    await expect(dialect.getDSL('one', { models: [] })).rejects.toThrow(error);
  });
});
