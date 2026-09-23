import { beforeEach, describe, expect, it, vi } from 'vitest';
import { experimental_evaluate as evaluate, generateText } from 'ai';

import { analyze } from '../src/analysis';
import { selectSubsetContext } from '../src/analysis/subset';
import { DuckDBQueryDialect } from '../src/query/duckdb';
import { stringifyProfile, stringifySchema } from '../src/util/context';

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
  it('selects only statistics while preserving all profile structure without mutating context', async () => {
    vi.mocked(evaluate).mockResolvedValue(selection(['t0f1', 't1f1']));
    const before = JSON.stringify({ schema, profile });
    const context = await selectSubsetContext('Total amount by customer name', { schema, profile });
    expect(evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'typesafe-ai/jev',
        state: { question: 'Total amount by customer name', schema: expect.not.stringContaining('123') },
      })
    );
    expect(context.schema).toBe(schema);
    expect(stringifySchema(context.profile!)).toBe(stringifySchema(profile));
    expect(context.profile?.tables.map((table) => table.metrics)).toEqual([{ row_count: 2 }, { row_count: 2 }, {}]);
    expect(context.profile?.tables.map((table) => table.fields.map((field) => field.metrics))).toEqual([
      [{}, { max: 123 }, {}],
      [{}, { max: 123 }, {}],
      [{}],
    ]);
    expect(context.profile?.relations).toBe(profile.relations);
    expect(JSON.stringify({ schema, profile })).toBe(before);
  });

  it('keeps a selected table for COUNT(*) and falls back when nothing is selected', async () => {
    vi.mocked(evaluate)
      .mockResolvedValueOnce(selection(['t0']))
      .mockResolvedValueOnce(selection([]));
    const context = { schema, profile };
    const selected = await selectSubsetContext('Count orders', context);
    expect(stringifySchema(selected.profile!)).toBe(stringifySchema(profile));
    expect(selected.profile?.tables[0].metrics).toEqual({ row_count: 2 });
    expect(
      selected.profile?.tables.flatMap((table) => table.fields).every((field) => !Object.keys(field.metrics).length)
    ).toBe(true);
    expect(await selectSubsetContext('Unknown question', context)).toBe(context);
  });

  it('preserves schema without calling the evaluator when no profile is available', async () => {
    const context = { schema };
    expect(await selectSubsetContext('Question', context)).toBe(context);
    expect(evaluate).not.toHaveBeenCalled();
  });

  it('rejects missing answers and propagates evaluator failures', async () => {
    vi.mocked(evaluate)
      .mockResolvedValueOnce({ answers: {} } as never)
      .mockRejectedValueOnce(new Error('Unavailable'));
    await expect(selectSubsetContext('Question', { schema, profile })).rejects.toThrow('Invalid subset selection');
    await expect(selectSubsetContext('Question', { schema, profile })).rejects.toThrow('Unavailable');
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
    expect(prompt).toContain('Dataset Profile: 3 table(s)');
    expect(prompt).toContain('Maximum: 123');
    expect(prompt).not.toContain('Dataset Info:');
    expect(prompt).toContain('private_note');
    expect(prompt).toContain('customers');
    expect(prompt).toContain('unrelated');
    expect(prompt.match(/Maximum: 123/g)).toHaveLength(1);
    expect(prompt).toContain(stringifyProfile((engine.getDSL as ReturnType<typeof vi.fn>).mock.calls[0][1].profile));
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
