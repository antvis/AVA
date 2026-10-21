import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { experimental_evaluate as evaluate, generateText } from 'ai';

import { analyze } from '../src/analysis';
import { AVA } from '../src';
import { selectSubsetDataModel } from '../src/analysis/subset';
import { DuckDBQueryDialect } from '../src/query/duckdb';
import { buildDataModel, stringifyDataModel } from '../src/util/data-model';
import { escapeMarkdown } from '../src/util/markdown';

import type { Experimental_EvaluationResult } from 'ai';
import type { AnalysisEngine, Profile, Schema } from '../src/types';

vi.mock('ai', () => ({ experimental_evaluate: vi.fn(), generateText: vi.fn(), createGateway: vi.fn(() => vi.fn()) }));

const schema: Schema = {
  models: [
    {
      name: 'orders',
      columns: ['customer_id', 'amount', 'private_note'].map((name) => ({ name, type: 'INTEGER' })),
      tableReference: { table: 'orders' },
    },
    {
      name: 'customers',
      columns: ['id', 'name', 'email'].map((name) => ({ name, type: 'VARCHAR' })),
      primaryKey: 'id',
      tableReference: { table: 'customers' },
    },
    { name: 'unrelated', columns: [{ name: 'secret', type: 'VARCHAR' }], tableReference: { table: 'unrelated' } },
  ],
  relationships: [
    {
      name: 'fk:["orders",["customer_id"],"customers",["id"]]',
      models: ['orders', 'customers'],
      joinType: 'MANY_TO_ONE',
      condition: '"orders"."customer_id" = "customers"."id"',
    },
  ],
};
const profile: Profile = {
  models: schema.models.map((table) => ({
    name: table.name,
    metrics: { row_count: 2 },
    columns: table.columns.map((field) => ({
      name: field.name,
      properties: { logicalType: 'numeric' },
      metrics: { max: 123 },
    })),
  })),
};

function selection(ids: string[]) {
  return {
    answers: Object.fromEntries(
      schema.models
        .flatMap((table, i) => [`t${i}`, ...table.columns.map((_, j) => `t${i}f${j}`)])
        .map((id) => [id, { type: 'boolean', probability: ids.includes(id) ? 0.99 : 0.01 }])
    ),
  } as Experimental_EvaluationResult<Record<string, { type: 'boolean'; instructions: string }>>;
}

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('Subset strategy', () => {
  it('selects only statistics while preserving all profile structure without mutating the data model', async () => {
    vi.mocked(evaluate).mockResolvedValue(selection(['t0f1', 't1f1']));
    const dataModel = buildDataModel({ schema, profile });
    dataModel.properties = { description: 'Sales' };
    dataModel.views = [{ name: 'totals', statement: 'SELECT SUM(amount) FROM orders' }];
    const before = structuredClone(dataModel);
    const selected = await selectSubsetDataModel('Total amount by customer name', dataModel);
    expect(evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'typesafe-ai/jev',
        state: { question: 'Total amount by customer name', dataModel: expect.not.stringContaining('123') },
      })
    );
    expect(selected.relationships).toBe(dataModel.relationships);
    expect(selected.properties).toBe(dataModel.properties);
    expect(selected.views).toBe(dataModel.views);
    dataModel.models.forEach((model, i) => {
      expect(selected.models[i]).toMatchObject({
        ...model,
        metrics: expect.any(Object),
        columns: model.columns.map((column) => ({ ...column, metrics: expect.any(Object) })),
      });
    });
    expect(selected.models.map((table) => table.metrics)).toEqual([{ row_count: 2 }, { row_count: 2 }, {}]);
    expect(selected.models.map((table) => table.columns.map((field) => field.metrics))).toEqual([
      [{}, { max: 123 }, {}],
      [{}, { max: 123 }, {}],
      [{}],
    ]);
    expect(dataModel).toEqual(before);
  });

  it('keeps a selected table for COUNT(*) and falls back when nothing is selected', async () => {
    vi.mocked(evaluate)
      .mockResolvedValueOnce(selection(['t0']))
      .mockResolvedValueOnce(selection([]));
    const dataModel = buildDataModel({ schema, profile });
    const selected = await selectSubsetDataModel('Count orders', dataModel);
    expect(selected.relationships).toBe(dataModel.relationships);
    expect(selected.models[0].metrics).toEqual({ row_count: 2 });
    expect(selected.models.flatMap((table) => table.columns).every((field) => !Object.keys(field.metrics).length)).toBe(
      true
    );
    expect(await selectSubsetDataModel('Unknown question', dataModel)).toBe(dataModel);
  });

  it('preserves schema without calling the evaluator when no profile is available', async () => {
    const dataModel = buildDataModel({ schema });
    expect(await selectSubsetDataModel('Question', dataModel)).toBe(dataModel);
    expect(evaluate).not.toHaveBeenCalled();
  });

  it('selects model metrics when columns are omitted', async () => {
    const dataModel = { models: [{ name: 'orders', baseObject: 'orders', metrics: { row_count: 2 } }] };
    vi.mocked(evaluate).mockResolvedValue({ answers: { t0: { type: 'boolean', probability: 1 } } } as never);
    expect(await selectSubsetDataModel('Count orders', dataModel)).toEqual(dataModel);
  });

  it('rejects missing answers and propagates evaluator failures', async () => {
    vi.mocked(evaluate)
      .mockResolvedValueOnce({ answers: {} } as never)
      .mockRejectedValueOnce(new Error('Unavailable'));
    await expect(selectSubsetDataModel('Question', buildDataModel({ schema, profile }))).rejects.toThrow(
      'Invalid subset selection'
    );
    await expect(selectSubsetDataModel('Question', buildDataModel({ schema, profile }))).rejects.toThrow('Unavailable');
    await expect(selectSubsetDataModel('Question', { models: [] })).rejects.toThrow('non-empty data model');
    await expect(selectSubsetDataModel('Question', {})).rejects.toThrow('non-empty data model');
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
      getDSL: vi.fn((query, dataModel) => dialect.getDSL(query, dataModel)),
    } as unknown as AnalysisEngine;
    const emit = vi.fn();
    const result = await analyze(
      'Total amount',
      { strategy: { type: 'subset' }, maxRows: 10, includeSummary },
      {
        emit,
        dataModel: buildDataModel({ schema, profile }),
        engine,
        llm: { provider: 'gateway', model: 'openai/gpt-5.5' },
      }
    );
    expect(emit.mock.calls.slice(0, 2).map(([event]) => event)).toEqual([
      { type: 'selectcontextstart', data: {} },
      { type: 'selectcontextend', data: {} },
    ]);
    const prompt = vi.mocked(generateText).mock.calls[0][0].prompt as string;
    expect(prompt).toContain('# Data Model');
    expect(prompt).toContain('max');
    expect(prompt).toContain('tableReference');
    expect(prompt).toContain(escapeMarkdown('MANY_TO_ONE'));
    expect(prompt).toContain(escapeMarkdown('private_note'));
    expect(prompt).toContain('customers');
    expect(prompt).toContain('unrelated');
    expect(prompt.match(/123/g)).toHaveLength(1);
    expect(prompt).toContain(stringifyDataModel((engine.getDSL as ReturnType<typeof vi.fn>).mock.calls[0][1]));
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
      expect(full.models[0].columns[1].metrics).toHaveProperty('mean', 6);
      const selected = getDSL.mock.calls[0][1];
      expect(selected.models[0].columns[1].metrics).toEqual({});
      await ava.translate('All fields');
      expect(getDSL).toHaveBeenLastCalledWith(
        'All fields',
        buildDataModel({ schema: await ava.schema(), profile: full })
      );

      const refreshed = await ava.profile({ metrics: ['sum'] });
      await ava.analyze('Values after refresh', config);
      expect(onProfile.mock.calls.map(([event]) => event)).toEqual([
        { type: 'profilestart', data: {} },
        { type: 'profileend', data: {} },
      ]);
      expect(compute).toHaveBeenCalledTimes(2);
      expect(getDSL.mock.calls.at(-1)![1].models[0].columns[0].metrics).toEqual({ sum: 6 });
      await ava.translate('Full refreshed profile');
      expect(getDSL).toHaveBeenLastCalledWith(
        'Full refreshed profile',
        buildDataModel({
          schema: await ava.schema(),
          profile: refreshed,
        })
      );

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
      expect(nextDSL).toHaveBeenCalledWith('Without profiling', await ava.schema());
      expect(evaluate).not.toHaveBeenCalled();
      expect(onEnd).toHaveBeenCalledExactlyOnceWith({ type: 'analyzeend', data: {} });
      expect(onProfile).not.toHaveBeenCalled();
    } finally {
      await ava.dispose();
    }
  });
});
