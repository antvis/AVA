import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { ClickHouseQueryDialect } from '../../../src/query/clickhouse';

import type { ClickHouseClient } from '@clickhouse/client';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../../src/util/model', () => ({ languageModel: vi.fn(() => 'test-model') }));

afterEach(() => vi.clearAllMocks());

const dialect = new ClickHouseQueryDialect({ model: 'test' });

describe('ClickHouse validation requests', () => {
  it('sends SQL only as a parameter and enforces readonly', async () => {
    const sql = "SELECT ';' AS value; -- trailing comment";
    const query = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => [{ query: "SELECT * FROM (SELECT ';' AS value)" }] })
      .mockResolvedValue({ text: async () => 'SelectWithUnionQuery (children 1)' });
    const client = { query } as unknown as ClickHouseClient;
    await expect(dialect.validateDSL(sql, client)).resolves.toBe("SELECT * FROM (SELECT ';' AS value)");
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        query_params: { sql },
        clickhouse_settings: { readonly: '1' },
      })
    );
    expect(query.mock.calls[0][0].query).not.toContain(sql);
    expect(query).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: "EXPLAIN AST SELECT * FROM (SELECT ';' AS value)",
        clickhouse_settings: { readonly: '1' },
      })
    );
    query.mockRejectedValueOnce(new Error('Syntax error'));
    await expect(dialect.validateDSL(sql, client)).rejects.toThrow('Syntax error');
    query.mockResolvedValueOnce({ json: async () => [] });
    await expect(dialect.validateDSL(sql, client)).rejects.toThrow('Missing ClickHouse SQL validation result');
  });
  it.each(['', 'AlterQuery', 'SelectWithUnionQuery (children 1)\n  Set'])(
    'fails closed for an unexpected or settings-bearing AST: %s',
    async (tree) => {
      const query = vi
        .fn()
        .mockResolvedValueOnce({ json: async () => [{ query: 'SELECT 1' }] })
        .mockResolvedValueOnce({ text: async () => tree });
      await expect(dialect.validateDSL('SELECT 1', { query } as unknown as ClickHouseClient)).rejects.toThrow();
    }
  );
});

describe('ClickHouse query generation', () => {
  it.each([
    ['SELECT 1', 'SELECT 1'],
    ['```sql\nSELECT 1\n```', 'SELECT 1'],
    ["SELECT '```' AS value", "SELECT '```' AS value"],
  ])('extracts SQL without corrupting literals: %s', async (text, expected) => {
    vi.mocked(generateText).mockResolvedValue({ text, usage: {} } as never);
    await expect(dialect.getDSL('query', { schema: { tables: [] } })).resolves.toBe(expected);
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
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        maxRetries: 0,
        prompt: expect.stringContaining('orders'),
      })
    );
    expect(onQueryUsage).toHaveBeenCalledWith(usage);
  });

  it('uses the profile when supplied', async () => {
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
  });
});
