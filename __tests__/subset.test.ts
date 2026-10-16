import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { experimental_evaluate as evaluate, generateText } from 'ai';

import { analyze } from '../src/analysis';
import { AVA } from '../src';
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
afterEach(() => vi.restoreAllMocks());

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
    const emit = vi.fn();
    const result = await analyze(
      'Total amount',
      { strategy: { type: 'subset' }, maxRows: 10, includeSummary },
      {
        emit,
        context: { schema, profile },
        engine,
        llm: { provider: 'gateway', model: 'openai/gpt-5.5' },
      }
    );
    expect(emit.mock.calls.slice(0, 2).map(([event]) => event)).toEqual([
      { type: 'selectcontextstart', data: {} },
      { type: 'selectcontextend', data: {} },
    ]);
    const prompt = vi.mocked(generateText).mock.calls[0][0].prompt as string;
    expect(prompt).toContain('Dataset Profile: 3 table(s)');
    expect(prompt).toContain('Maximum: 123');
    expect(prompt).not.toContain('Dataset Info:');
    expect(prompt).toContain('private_note');
    expect(prompt).toContain('customers');
    expect(prompt).toContain('unrelated');
    expect(prompt.match(/Maximum: 123/g)).toHaveLength(1);
    expect(prompt).toContain(stringifyProfile((engine.getDSL as ReturnType<typeof vi.fn>).mock.calls[0][1].profile));
    expect(engine.profile).not.toHaveBeenCalled();
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

describe('AVA subset profiling', () => {
  const source = {
    type: 'json' as const,
    options: {
      data: [
        { value: 2, other: 4 },
        { value: 4, other: 8 },
      ],
    },
  };
  const config = { strategy: { type: 'subset' as const }, includeSummary: false };

  beforeEach(() => {
    vi.mocked(evaluate).mockResolvedValue({
      answers: {
        t0: { type: 'boolean', probability: 0 },
        t0f0: { type: 'boolean', probability: 1 },
        t0f1: { type: 'boolean', probability: 0 },
      },
    } as never);
  });

  it('retains the complete profile across analyses, refreshes explicitly and resets on source replacement', async () => {
    const ava = new AVA({ llm: { model: 'unused' }, engine: { type: 'javascript' } });
    try {
      await ava.source(source);
      const compute = vi.spyOn(ava.engine!, 'profile');
      const getDSL = vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('const result = data;');
      const onProfile = vi.fn();
      ava.on('profilestart', onProfile);
      ava.on('profileend', onProfile);

      await ava.analyze('Values', config);
      await ava.analyze('Values again', config);
      expect(compute).toHaveBeenCalledOnce();
      expect(onProfile).not.toHaveBeenCalled();
      const full = await compute.mock.results[0].value;
      expect(full.tables[0].fields[1].metrics).toHaveProperty('mean', 6);
      const selected = getDSL.mock.calls[0][1].profile!;
      expect(selected.tables[0].fields[1].metrics).toEqual({});
      await ava.translate('All fields');
      expect(getDSL).toHaveBeenLastCalledWith('All fields', { schema: await ava.schema(), profile: full });

      const refreshed = await ava.profile({ metrics: ['sum'] });
      await ava.analyze('Values after refresh', config);
      expect(onProfile.mock.calls.map(([event]) => event)).toEqual([
        { type: 'profilestart', data: {} },
        { type: 'profileend', data: {} },
      ]);
      expect(compute).toHaveBeenCalledTimes(2);
      expect(getDSL.mock.calls.at(-1)![1].profile!.tables[0].fields[0].metrics).toEqual({ sum: 6 });
      await ava.translate('Full refreshed profile');
      expect(getDSL).toHaveBeenLastCalledWith('Full refreshed profile', {
        schema: await ava.schema(),
        profile: refreshed,
      });

      await ava.source(source);
      await ava.profile(undefined, () => full);
      const importedCompute = vi.spyOn(ava.engine!, 'profile');
      vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('const result = data;');
      await ava.analyze('Imported values', config);
      expect(importedCompute).not.toHaveBeenCalled();

      await ava.source(source);
      const nextCompute = vi.spyOn(ava.engine!, 'profile');
      vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('const result = data;');
      await ava.analyze('New values', config);
      expect(nextCompute).toHaveBeenCalledOnce();
    } finally {
      await ava.dispose();
    }
  });

  it('retries failed profiling and keeps schema-only analysis available for unsupported engines', async () => {
    const ava = new AVA({ llm: { model: 'unused' }, engine: { type: 'javascript' } });
    try {
      await ava.source(source);
      const error = new Error('Profiling failed');
      const compute = vi.spyOn(ava.engine!, 'profile').mockRejectedValueOnce(error);
      const getDSL = vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('const result = data;');
      const onEnd = vi.fn();
      const onProfile = vi.fn();
      ava.on('profilestart', onProfile);
      ava.on('profileend', onProfile);
      ava.on('analyzeend', onEnd);
      await expect(ava.analyze('Values', config)).rejects.toBe(error);
      expect(onEnd).toHaveBeenCalledExactlyOnceWith({
        type: 'analyzeend',
        data: { error: { name: 'Error', message: error.message } },
      });
      expect(onProfile).not.toHaveBeenCalled();
      expect(getDSL).not.toHaveBeenCalled();
      await ava.analyze('Retry', config);
      await ava.analyze('Reuse', config);
      expect(compute).toHaveBeenCalledTimes(2);

      await ava.source(source);
      ava.engine!.profile = undefined;
      const nextDSL = vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue('const result = data;');
      vi.mocked(evaluate).mockClear();
      onEnd.mockClear();
      await ava.analyze('Without profiling', config);
      expect(nextDSL).toHaveBeenCalledWith('Without profiling', { schema: await ava.schema(), profile: null });
      expect(evaluate).not.toHaveBeenCalled();
      expect(onEnd).toHaveBeenCalledExactlyOnceWith({ type: 'analyzeend', data: {} });
      expect(onProfile).not.toHaveBeenCalled();
    } finally {
      await ava.dispose();
    }
  });
});
