import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { BIGQUERY_INSTRUCTIONS, BigQueryQueryDialect } from '../../../src/query/bigquery';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../../src/util/model', () => ({ languageModel: vi.fn(() => 'test-model') }));

afterEach(() => vi.clearAllMocks());

const dialect = new BigQueryQueryDialect({ model: 'test' });

describe('BigQuery query validation', () => {
  it('accepts only statements that BigQuery classifies as SELECT', async () => {
    const dryRun = vi.fn().mockResolvedValue({ statementType: 'SELECT' });
    const sql = 'WITH t AS (SELECT 1 AS x) SELECT x FROM t; -- trailing comment';
    await expect(dialect.validateDSL(sql, dryRun)).resolves.toBe(sql);
    expect(dryRun).toHaveBeenCalledExactlyOnceWith(sql);

    for (const statementType of ['SCRIPT', 'INSERT', 'MERGE', 'CREATE_TABLE', 'EXPORT_DATA', 'CALL']) {
      dryRun.mockResolvedValueOnce({ statementType });
      await expect(dialect.validateDSL(sql, dryRun)).rejects.toThrow(`, got ${statementType}`);
    }
    dryRun.mockResolvedValueOnce({});
    await expect(dialect.validateDSL(sql, dryRun)).rejects.toThrow('one read-only SELECT statement');
    dryRun.mockRejectedValueOnce(new Error('Syntax error: Unexpected end of script at [1:9]'));
    await expect(dialect.validateDSL('SELECT (', dryRun)).rejects.toThrow('Syntax error');
  });
});

describe('BigQuery query generation', () => {
  it.each([
    ['SELECT 1', 'SELECT 1'],
    ['```sql\nSELECT 1\n```', 'SELECT 1'],
    ["SELECT '```' AS value", "SELECT '```' AS value"],
  ])('extracts SQL without corrupting literals: %s', async (text, expected) => {
    vi.mocked(generateText).mockResolvedValue({ text, usage: {} } as never);
    await expect(dialect.getDSL('query', { models: [] })).resolves.toEqual({ dsl: expected, usage: {} });
  });

  it('asks for GoogleSQL with the data model and retries, and returns the token usage', async () => {
    const usage = { totalTokens: 12 };
    vi.mocked(generateText).mockResolvedValue({ text: 'SELECT 1', usage } as never);
    const result = await new BigQueryQueryDialect({ model: 'test', maxRetries: 0 }).getDSL('count orders', {
      models: [
        {
          name: 'order items',
          columns: [{ name: 'sale_price', type: 'FLOAT64' }],
          tableReference: { catalog: 'bigquery-public-data', schema: 'thelook_ecommerce', table: 'order items' },
        },
      ],
    });
    const { prompt, maxRetries } = vi.mocked(generateText).mock.calls[0][0] as { prompt: string; maxRetries: number };
    expect(maxRetries).toBe(0);
    expect(prompt).toContain('order items');
    expect(prompt).toContain('User Query: count orders');
    expect(prompt).toContain(BIGQUERY_INSTRUCTIONS);
    expect(BIGQUERY_INSTRUCTIONS).toContain('GoogleSQL');
    expect(BIGQUERY_INSTRUCTIONS).toContain('backticks');
    expect(result).toEqual({ dsl: 'SELECT 1', usage });
  });
});
