import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { ClickHouseSQLDialect } from '../../src/query/clickhouse-sql';
import { limitedQuery } from '../../src/util/result';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../src/util/model', () => ({ languageModel: vi.fn(() => 'test-model') }));
const parserState = vi.hoisted(() => ({ loads: 0 }));
vi.mock('@clickhouse/parser', async (importOriginal) => {
  parserState.loads += 1;
  return importOriginal();
});

afterEach(() => vi.clearAllMocks());

const dialect = new ClickHouseSQLDialect({ model: 'test' });

describe('ClickHouse SQL validation', () => {
  it('loads the parser only when validating SQL', async () => {
    vi.mocked(generateText).mockResolvedValue({ text: 'SELECT 1', finishReason: 'stop' } as never);
    expect(parserState.loads).toBe(0);
    expect((await dialect.getDSL('one', { models: [] })).dsl).toBe('SELECT 1');
    expect(parserState.loads).toBe(0);
    await dialect.validateDSL('SELECT 1');
    expect(parserState.loads).toBe(1);
  });

  it.each([
    'SELECT 1 UNION SELECT 1',
    'SELECT 1 INTERSECT ALL SELECT 1',
    "WITH q AS (SELECT '中文😀; SETTINGS readonly=0' AS `settings`) SELECT `settings` FROM q UNION ALL SELECT 'out_file; format'",
    'SELECT 1 -- trailing line comment',
  ])('preserves query text and semantics while removing the terminator: %s', async (sql) => {
    const { parse } = await import('@clickhouse/parser');
    const normalized = await dialect.validateDSL(`${sql}\n; -- trailing statement comment`);
    expect(normalized).toBe(sql);
    expect(parse(limitedQuery(normalized, 2))).toHaveLength(1);
  });

  it.each([
    'SELECT (',
    'DROP TABLE orders',
    'SELECT 1; SELECT 2',
    'SELECT 1 SETTINGS readonly=0',
    'SELECT * FROM (SELECT 1 SETTINGS readonly=0)',
    'WITH q AS (SELECT 1 SETTINGS readonly=0) SELECT * FROM q',
    "SELECT 1 EXCEPT ALL SELECT 2 INTO OUTFILE '/tmp/ava-must-not-write'",
    'SELECT 1 INTERSECT ALL SELECT 2 FORMAT CSV',
    'SELECT 1 PARALLEL WITH SELECT 2',
  ])('rejects invalid, mutating or restricted SQL: %s', async (sql) => {
    await expect(dialect.validateDSL(sql)).rejects.toThrow();
  });
});

describe('ClickHouse SQL generation', () => {
  it('extracts SQL and preserves usage and model context', async () => {
    const sql = "SELECT '```' AS value";
    const usage = { inputTokens: 10, outputTokens: 5, totalTokens: 15 };
    vi.mocked(generateText).mockResolvedValue({ text: `\`\`\`sql\n${sql}\n\`\`\``, usage, finishReason: 'stop' } as never);
    const result = await new ClickHouseSQLDialect({ model: 'test', maxRetries: 0 }).getDSL('count orders', {
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
