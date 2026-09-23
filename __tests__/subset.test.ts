import { beforeEach, describe, expect, it, vi } from 'vitest';
import { experimental_evaluate as evaluate, generateText } from 'ai';

import { analyze } from '../src/analysis';
import { selectSubsetContext } from '../src/analysis/subset';
import { DuckDBQueryDialect } from '../src/query/duckdb';

import type { Experimental_EvaluationResult } from 'ai';
import type { AnalysisEngine, Profile, Schema } from '../src/types';

vi.mock('ai', () => ({ experimental_evaluate: vi.fn(), generateText: vi.fn(), createGateway: vi.fn(() => vi.fn()) }));

const schema: Schema = {
  tables: [
    {
      name: 'orders',
      columnCount: 3,
      fields: ['customer_id', 'amount', 'private_note'].map((name) => ({ name, type: 'INTEGER' })),
      indexes: [],
    },
    {
      name: 'customers',
      columnCount: 3,
      fields: ['id', 'name', 'email'].map((name) => ({ name, type: 'VARCHAR' })),
      indexes: [
        { name: 'pk', columns: ['id'], unique: true, primary: true },
        { name: 'email_idx', columns: ['email'], unique: false },
      ],
    },
    { name: 'unrelated', columnCount: 1, fields: [{ name: 'secret', type: 'VARCHAR' }], indexes: [] },
  ],
  relations: [
    {
      kind: 'foreign-key',
      from: { table: 'orders', columns: ['customer_id'] },
      to: { table: 'customers', columns: ['id'] },
    },
  ],
};
const profile: Profile = {
  ...schema,
  generatedAt: 0,
  tables: schema.tables.map((table) => ({
    ...table,
    metrics: { row_count: 2 },
    fields: table.fields.map((field) => ({ ...field, logicalType: 'numeric', metrics: { max: 123 } })),
  })),
};

function selection(ids: string[]) {
  return {
    answers: Object.fromEntries(
      schema.tables
        .flatMap((table, i) => [`t${i}`, ...table.fields.map((_, j) => `t${i}f${j}`)])
        .map((id) => [id, { type: 'boolean', probability: ids.includes(id) ? 0.99 : 0.01 }])
    ),
  } as Experimental_EvaluationResult<Record<string, { type: 'boolean'; instructions: string }>>;
}

beforeEach(() => vi.resetAllMocks());

describe('Subset strategy', () => {
  it('passes only schema to Jev and projects profile, join keys, and indexes without mutating context', async () => {
    vi.mocked(evaluate).mockResolvedValue(selection(['t0f1', 't1f1']));
    const before = JSON.stringify({ schema, profile });
    const context = await selectSubsetContext('Total amount by customer name', { schema, profile });
    expect(evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'typesafe-ai/jev',
        state: { question: 'Total amount by customer name', schema: expect.not.stringContaining('123') },
      })
    );
    expect(context.schema.tables.map((table) => table.fields.map((field) => field.name))).toEqual([
      ['customer_id', 'amount'],
      ['id', 'name'],
    ]);
    expect(context.profile?.tables.map((table) => table.columnCount)).toEqual([2, 2]);
    expect(context.profile?.tables[0].fields[1].metrics.max).toBe(123);
    expect(context.profile?.tables[1].indexes.map((index) => index.name)).toEqual(['pk']);
    expect(context.profile?.relations).toEqual(schema.relations);
    expect(JSON.stringify({ schema, profile })).toBe(before);
  });

  it('keeps a selected table for COUNT(*) and falls back when nothing is selected', async () => {
    vi.mocked(evaluate)
      .mockResolvedValueOnce(selection(['t0']))
      .mockResolvedValueOnce(selection([]));
    const context = { schema, profile };
    expect((await selectSubsetContext('Count orders', context)).schema.tables).toEqual([
      { ...schema.tables[0], fields: [], columnCount: 0 },
    ]);
    expect(await selectSubsetContext('Unknown question', context)).toBe(context);
  });

  it('rejects missing answers and propagates evaluator failures', async () => {
    vi.mocked(evaluate)
      .mockResolvedValueOnce({ answers: {} } as never)
      .mockRejectedValueOnce(new Error('Unavailable'));
    await expect(selectSubsetContext('Question', { schema })).rejects.toThrow('Invalid subset selection');
    await expect(selectSubsetContext('Question', { schema })).rejects.toThrow('Unavailable');
    await expect(selectSubsetContext('Question', { schema: { tables: [] } })).rejects.toThrow('non-empty schema');
  });

  it.each([true, false])('passes reduced profile through direct with includeSummary=%s', async (includeSummary) => {
    vi.mocked(evaluate).mockResolvedValue(selection(['t0f1']));
    vi.mocked(generateText).mockResolvedValueOnce({ text: 'SELECT SUM(amount) FROM orders' } as never);
    if (includeSummary) vi.mocked(generateText).mockResolvedValueOnce({ text: 'Total amount is 246.' } as never);
    const dialect = new DuckDBQueryDialect({ provider: 'gateway', model: 'openai/gpt-5.5' });
    const engine = {
      language: { name: 'DuckDB SQL', fence: 'sql' },
      profile: vi.fn().mockResolvedValue(profile),
      execute: vi.fn().mockResolvedValue({ data: [{ total: 246 }], schema: [{ name: 'total' }] }),
      getDSL: vi.fn((query, context) => dialect.getDSL(query, context)),
    } as unknown as AnalysisEngine;
    const result = await analyze(
      'Total amount',
      { strategy: { type: 'subset' }, maxRows: 10, includeSummary },
      {
        context: { schema },
        engine,
        llm: { provider: 'gateway', model: 'openai/gpt-5.5' },
      }
    );
    const prompt = vi.mocked(generateText).mock.calls[0][0].prompt as string;
    expect(prompt).toContain('Dataset Profile: 1 table(s)');
    expect(prompt).toContain('Maximum: 123');
    expect(prompt).not.toMatch(/private_note|customers|unrelated/);
    expect(engine.getDSL).toHaveBeenCalledOnce();
    expect(engine.execute).toHaveBeenCalledOnce();
    expect(generateText).toHaveBeenCalledTimes(includeSummary ? 2 : 1);
    expect(result.text).toBe(includeSummary ? 'Total amount is 246.' : '');
    expect(engine.execute).toHaveBeenCalledWith(
      'SELECT SUM(amount) FROM orders',
      expect.objectContaining({ maxRows: 10 })
    );
    expect(result.data).toEqual([{ total: 246 }]);
  });
});
