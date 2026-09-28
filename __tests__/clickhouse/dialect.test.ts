import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { ClickHouseQueryDialect } from '../../src/query/clickhouse';
import { languageModel } from '../../src/util/model';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../src/util/model', () => ({ languageModel: vi.fn(() => 'test-model') }));

afterEach(() => vi.clearAllMocks());

const dialect = new ClickHouseQueryDialect({ model: 'test' });

describe('ClickHouse SQL syntax', () => {
  it.each([
    String.raw`SELECT 'it\'s DROP; TABLE' AS value`,
    String.raw`SELECT '\\', 'it''s INSERT; SELECT'`,
    String.raw`SELECT "a\"; DROP", "a""; INSERT" FROM t`,
    'SELECT `a\\`; DROP`, `a``; INSERT` FROM t',
    'SELECT $heredoc$SHOW CREATE VIEW t; \' " \\ $other$$heredoc$',
    'SELECT $$DROP; INSERT$$, $123$ALTER;$123$',
    '/* outer /* inner */ DROP; */ SELECT 1',
    '-- DROP;\nSELECT 1',
    '#!DROP;\nSELECT 1',
    '# DROP;\nSELECT 1',
    '//DROP;\nSELECT 1',
    'SELECT 1; -- DROP;',
    'SELECT 1; /* DROP; /* nested */ */',
    "SELECT ';' AS x -- DROP;",
    'WITH cte AS (SELECT 1) SELECT * FROM cte',
    'WITH 1 AS n SELECT n UNION ALL SELECT 2',
    'SELECT "DROP", `INSERT` FROM t SETTINGS max_threads = 1',
  ])('accepts %s', async (sql) => {
    await expect(dialect.validateDSL(sql)).resolves.toBeUndefined();
  });

  it.each([
    '',
    '-- SELECT 1',
    '/* SELECT 1 */',
    "'SELECT'",
    '123 SELECT 1',
    'SELECT 1; SELECT 2',
    'SELECT 1; -- ignored\nDROP TABLE t',
    "SELECT 1; 'hidden second statement'",
    'SELECT 1;;',
    'DROP TABLE t',
    'INSERT INTO t SELECT 1',
    'WITH cte AS (SELECT 1) INSERT INTO t SELECT * FROM cte',
    'WITH cte AS (SELECT 1)',
    "SELECT 'unclosed",
    'SELECT "unclosed',
    'SELECT `unclosed',
    "SELECT 'trailing" + String.fromCharCode(92),
    'SELECT $tag$unclosed',
    'SELECT 1 /* outer /* inner */',
    'SELECT (1',
    'SELECT 1)',
    "SELECT 1 INTO /* ignored */ OUTFILE '/tmp/result'",
    'SELECT 1 PARALLEL /* ignored */ WITH SELECT 2',
    String.raw`SELECT '\\'; DROP TABLE t`,
    'SELECT $tag$SELECT 1;$tag$; DROP TABLE t',
    'SELECT name$tag$; DROP TABLE t -- $tag$',
  ])('rejects %s', async (sql) => {
    await expect(dialect.validateDSL(sql)).rejects.toThrow();
  });

  it('preserves literals and removes only the actual statement terminator', () => {
    expect(dialect.prepareQuery("SELECT ';', '😀'; -- comment")).toBe("SELECT ';', '😀'");
    expect(dialect.prepareQuery('SELECT 1 -- comment')).toBe('SELECT 1 -- comment');
  });
});

describe('ClickHouse query generation', () => {
  it.each(['SELECT 1', '```sql\nSELECT 1\n```', '```SQL\r\nSELECT 1\r\n```', '```\nSELECT 1\n```'])(
    'returns SQL from %s',
    async (text) => {
      vi.mocked(generateText).mockResolvedValue({ text, usage: {} } as never);
      await expect(dialect.getDSL('count rows', { schema: { tables: [] } })).resolves.toBe('SELECT 1');
    }
  );

  it('does not remove unpaired fences or backticks inside SQL', async () => {
    for (const text of ["SELECT '```' AS value", '```sql\nSELECT 1']) {
      vi.mocked(generateText).mockResolvedValue({ text, usage: {} } as never);
      await expect(dialect.getDSL('query', { schema: { tables: [] } })).resolves.toBe(text);
    }
  });

  it('passes schema context, retries, and token usage through', async () => {
    const onQueryUsage = vi.fn();
    const config = { model: 'test', maxRetries: 0, onQueryUsage };
    const usage = { totalTokens: 12 };
    vi.mocked(generateText).mockResolvedValue({ text: 'SELECT 1', usage } as never);
    await new ClickHouseQueryDialect(config).getDSL('count rows', {
      schema: {
        tables: [{ name: 'orders', indexes: [], fields: [{ name: 'amount', type: 'UInt32' }], columnCount: 1 }],
      },
    });
    expect(languageModel).toHaveBeenCalledWith(config);
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        maxRetries: 0,
        prompt: expect.stringContaining('orders'),
      })
    );
    expect(onQueryUsage).toHaveBeenCalledWith(usage);
  });

  it('uses the profile when supplied and propagates model errors', async () => {
    vi.mocked(generateText).mockResolvedValue({ text: 'SELECT 1', usage: {} } as never);
    await dialect.getDSL('count rows', {
      schema: { tables: [] },
      profile: {
        tables: [{ name: 'profile_table', indexes: [], fields: [], columnCount: 0, metrics: { row_count: 42 } }],
        generatedAt: 0,
      },
    });
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        maxRetries: 3,
        prompt: expect.stringContaining('profile_table'),
      })
    );
    vi.mocked(generateText).mockRejectedValueOnce(new Error('model unavailable'));
    await expect(dialect.getDSL('count rows', { schema: { tables: [] } })).rejects.toThrow('model unavailable');
  });
});
