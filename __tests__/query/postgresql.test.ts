import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { PostgreSQLDialect } from '../../src/query/postgresql';
import { limitedQuery } from '../../src/util/result';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../src/util/model', () => ({ languageModel: vi.fn(() => 'test-model') }));
const parserState = vi.hoisted(() => ({ loads: 0 }));
vi.mock('@supabase/pg-parser', async (importOriginal) => {
  parserState.loads += 1;
  return importOriginal();
});

afterEach(() => vi.clearAllMocks());

const dialect = new PostgreSQLDialect({ model: 'test' });

describe('PostgreSQL validation', () => {
  it('loads the parser only when validating SQL', async () => {
    vi.mocked(generateText).mockResolvedValue({ text: 'SELECT 1', finishReason: 'stop' } as never);
    expect(parserState.loads).toBe(0);
    expect((await dialect.getDSL('one', { models: [] })).dsl).toBe('SELECT 1');
    expect(parserState.loads).toBe(0);
    await dialect.validateDSL('SELECT 1');
    expect(parserState.loads).toBe(1);
  });

  it.each([
    'SELECT 1 UNION SELECT 1 INTERSECT ALL SELECT 1',
    "/* 中文😀 */ SELECT 9223372036854775807 AS n, E'it\\'s; -- literal' AS text",
    'WITH q AS (SELECT $body$; DELETE FROM orders;$body$ AS "intoClause") SELECT "intoClause" FROM q /*+ SeqScan(q) */',
    'SELECT 1 -- trailing line comment',
  ])('preserves source semantics and comments for embedding: %s', async (sql) => {
    const { PgParser, unwrapParseResult } = await import('@supabase/pg-parser');
    const normalized = await dialect.validateDSL(`${sql}\n; -- trailing statement comment`);
    expect(normalized).toBe(sql);
    const tree = await unwrapParseResult(new PgParser().parse(limitedQuery(normalized, 2)));
    expect(tree.stmts).toHaveLength(1);
    expect(tree.stmts[0].stmt).toHaveProperty('SelectStmt');
  });

  it('extracts the statement between empty statements using UTF-8 byte offsets', async () => {
    const sql = "/* 中文😀 */ SELECT '😀' AS value";
    await expect(dialect.validateDSL(`;;${sql}; ; -- tail`)).resolves.toBe(sql);
  });

  it.each(['SELECT (', 'SELECT 1\0; DELETE FROM orders'])(
    'rejects invalid or truncated input: %s',
    async (sql) => {
      await expect(dialect.validateDSL(sql)).rejects.toThrow();
    }
  );

  it.each([
    '',
    'SELECT 1; SELECT 2',
    'DELETE FROM orders',
    'WITH q AS (DELETE FROM orders RETURNING *) SELECT * FROM q',
    'SELECT * INTO copied_orders FROM orders',
    'SELECT 1 UNION (SELECT 2 INTO copied_orders)',
    'SELECT * FROM (SELECT * FROM orders FOR SHARE) q',
  ])('rejects writes and row locks throughout the AST: %s', async (sql) => {
    await expect(dialect.validateDSL(sql)).rejects.toThrow('read-only SELECT');
  });
});

describe('PostgreSQL generation', () => {
  it('extracts SQL and preserves usage and model context', async () => {
    const sql = "SELECT '```' AS value";
    const usage = { inputTokens: 10, outputTokens: 5, totalTokens: 15 };
    vi.mocked(generateText).mockResolvedValue({ text: `\`\`\`sql\n${sql}\n\`\`\``, usage, finishReason: 'stop' } as never);
    const result = await new PostgreSQLDialect({ model: 'test', maxRetries: 0 }).getDSL('count orders', {
      models: [{ name: 'orders', columns: [], metrics: { row_count: 42 } }],
    });
    expect(result).toEqual({ dsl: sql, usage });
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({ maxRetries: 0, prompt: expect.stringContaining('orders') })
    );
    expect(vi.mocked(generateText).mock.calls[0][0].prompt).toContain('42');
    expect(vi.mocked(generateText).mock.calls[0][0].prompt).toContain('count orders');
  });

  it.each([
    { text: 'SELECT 1', finishReason: 'length', error: 'did not complete' },
    { text: '```sql\n\n```', finishReason: 'stop', error: 'empty query' },
  ])('rejects unusable generation: $error', async ({ text, finishReason, error }) => {
    vi.mocked(generateText).mockResolvedValue({ text, finishReason } as never);
    await expect(dialect.getDSL('one', { models: [] })).rejects.toThrow(error);
  });
});
