import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { analyze } from '../src/analysis';

import type { AnalysisEngine } from '../src/types';

vi.mock('ai', () => ({
  generateText: vi.fn(),
  experimental_evaluate: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({ createOpenAI: vi.fn(() => ({ chat: vi.fn() })) }));

const narrative = { queryExplanation: 'Return the constant 1.', conclusion: 'One result.' };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(generateText).mockResolvedValue({ text: JSON.stringify(narrative) } as never);
});

describe('directAnalysis', () => {
  it('generates and executes exactly one DSL statement', async () => {
    const queryResult = { data: [{ value: 1 }], schema: [{ name: 'value', type: 'INTEGER' }], rowCount: 1 };
    const engine = {
      getDSL: vi.fn().mockResolvedValue('SELECT 1'),
      execute: vi.fn().mockResolvedValue(queryResult),
    } as unknown as AnalysisEngine;

    const emit = vi.fn();
    const result = await analyze(
      'Give me one',
      { strategy: { type: 'direct' }, maxRows: 5, maxResultBytes: 1024 },
      { emit, dataModel: { models: [] }, engine, llm: { model: 'test', apiKey: 'test' } }
    );

    expect(engine.getDSL).toHaveBeenCalledOnce();
    expect(emit.mock.calls.map(([event]) => event)).toEqual([
      { type: 'translatestart', id: 't-0-0', parentIds: [], data: { query: 'Give me one', step: 0, attempt: 0 } },
      { type: 'translateend', id: 't-0-0', parentIds: [], data: { dsl: 'SELECT 1' } },
      { type: 'querystart', id: 'q-0-0', parentIds: ['t-0-0'], data: { dsl: 'SELECT 1', step: 0, attempt: 0 } },
      { type: 'queryend', id: 'q-0-0', parentIds: ['t-0-0'], data: queryResult },
      { type: 'summarizestart', id: 's-0', parentIds: ['q-0-0'], data: { query: 'Give me one', step: 0 } },
      { type: 'summarizeend', id: 's-0', parentIds: ['q-0-0'], data: { ...narrative, text: result.text } },
    ]);
    expect(engine.getDSL).toHaveBeenCalledWith('Give me one', { models: [] });
    expect(engine.execute).toHaveBeenCalledWith('SELECT 1', {
      strategy: { type: 'direct' },
      maxRows: 5,
      maxResultBytes: 1024,
    });
    expect(result).toMatchObject({
      query: 'Give me one',
      data: [{ value: 1 }],
      schema: [{ name: 'value', type: 'INTEGER' }],
      rowCount: 1,
      sql: 'SELECT 1',
      text: 'One result.',
      ...narrative,
      id: 'conclusion',
      parentIds: ['s-0'],
      completionReason: 'completed',
    });
  });
});

it.each([undefined, true, false])('direct includeSummary=%s controls the summary call', async (includeSummary) => {
  const execution = { data: [{ value: 1 }], schema: [{ name: 'value' }], truncatedBy: 'maxRows', truncated: true };
  const engine = {
    getDSL: vi.fn().mockResolvedValue('SELECT 1'),
    execute: vi.fn().mockResolvedValue(execution),
  } as unknown as AnalysisEngine;
  const result = await analyze(
    'Give me one',
    { includeSummary },
    { emit: vi.fn(), dataModel: { models: [] }, engine, llm: { model: 'test' } }
  );
  expect(result).toMatchObject({ ...execution, sql: 'SELECT 1', text: includeSummary === false ? '' : 'One result.' });
  expect(engine.execute).toHaveBeenCalledOnce();
  expect(generateText).toHaveBeenCalledTimes(includeSummary === false ? 0 : 1);
});

it.each([0, 1, 2])('loop omits summary with maxSteps=%s, retaining verification when possible', async (maxSteps) => {
  vi.mocked(generateText).mockResolvedValueOnce({ text: '[SQL]\n```sql\nSELECT 1\n```' } as never);
  if (maxSteps === 2) vi.mocked(generateText).mockResolvedValueOnce({ text: '[CONFIRM] Result verified.' } as never);
  const engine = {
    language: { name: 'SQL', fence: 'sql' },
    execute: vi.fn().mockResolvedValue({ data: [{ value: 1 }], schema: [{ name: 'value' }] }),
  } as unknown as AnalysisEngine;
  const emit = vi.fn();
  const result = await analyze(
    'Give me one',
    { strategy: { type: 'loop', maxSteps }, includeSummary: false },
    { emit, dataModel: { models: [] }, engine, llm: { model: 'test' } }
  );
  expect(result).toMatchObject({ data: [{ value: 1 }], sql: 'SELECT 1', text: '' });
  expect(emit.mock.calls.find(([event]) => event.type === 'querystart')?.[0].data).toEqual({ dsl: 'SELECT 1' });
  expect(emit.mock.calls.find(([event]) => event.type === 'reasonend')?.[0].data).toMatchObject({
    step: 0,
    action: 'SQL',
  });
  expect(engine.execute).toHaveBeenCalledOnce();
  expect(generateText).toHaveBeenCalledTimes(maxSteps === 2 ? 2 : 1);
  expect(vi.mocked(generateText).mock.calls[0][0].prompt).toContain('without a summary or conclusion');
});

it('direct corrections retain failed dependencies and form one complete step', async () => {
  const execution = { data: [{ value: 1 }], schema: [{ name: 'value' }], truncated: true, truncatedBy: 'maxRows' };
  const engine = {
    getDSL: vi.fn().mockResolvedValueOnce('BAD').mockResolvedValueOnce('SELECT 1'),
    execute: vi.fn().mockRejectedValueOnce(new Error('Invalid SQL')).mockResolvedValueOnce(execution),
  } as unknown as AnalysisEngine;
  const emit = vi.fn();
  const onQueryUsage = vi.fn();
  const report = { ...narrative, nextStep: 'Check the source distribution.' };
  vi.mocked(generateText).mockResolvedValueOnce({
    text: '```json\n' + JSON.stringify(report) + '\n```',
    usage: {},
  } as never);
  const result = await analyze(
    'Give me one',
    { strategy: { type: 'direct' }, telemetry: true },
    {
      engine,
      emit,
      dataModel: { models: [] },
      llm: { model: 'test', onQueryUsage },
    }
  );
  const events = emit.mock.calls.map(([event]) => event);
  const starts = events.filter((event) => event.type.endsWith('start'));
  expect(starts.map(({ id, parentIds }) => ({ id, parentIds }))).toEqual([
    { id: 't-0-0', parentIds: [] },
    { id: 'q-0-0', parentIds: ['t-0-0'] },
    { id: 't-0-1', parentIds: ['q-0-0'] },
    { id: 'q-0-1', parentIds: ['t-0-1'] },
    { id: 's-0', parentIds: ['q-0-1'] },
  ]);
  expect(starts.every((event) => event.data.step === 0)).toBe(true);
  for (const start of starts) {
    expect(events.find((event) => event.id === start.id && event.type.endsWith('end'))).toMatchObject({
      id: start.id,
      parentIds: start.parentIds,
    });
  }
  expect(starts[2].data.input).toContain('Invalid SQL');
  const prompt = vi.mocked(generateText).mock.calls[0][0].prompt as string;
  expect(prompt).toContain('SELECT 1');
  expect(prompt).toContain(JSON.stringify(execution));
  expect(starts.at(-1).data.prompt).toBe(prompt);
  expect(result).toMatchObject({ ...report, text: report.conclusion, parentIds: ['s-0'] });
  expect(onQueryUsage).toHaveBeenCalledOnce();
});

it.each(['translate', 'query', 'summarize'])('direct closes the %s event on failure', async (phase) => {
  const engine = {
    getDSL:
      phase === 'translate'
        ? vi.fn().mockRejectedValue(new Error('Translation failed'))
        : vi.fn().mockResolvedValue('SELECT 1'),
    execute:
      phase === 'query'
        ? vi.fn().mockRejectedValue(new Error('Query failed'))
        : vi.fn().mockResolvedValue({ data: [], schema: [] }),
  } as unknown as AnalysisEngine;
  // A nonempty explanation and conclusion are mandatory when summaries are enabled.
  if (phase === 'summarize') vi.mocked(generateText).mockResolvedValueOnce({ text: '{"conclusion":""}' } as never);
  const emit = vi.fn();
  await expect(
    analyze(
      'Question',
      { strategy: { type: 'direct', maxRetries: 0 } },
      {
        engine,
        emit,
        dataModel: { models: [] },
        llm: { model: 'test' },
      }
    )
  ).rejects.toThrow();
  const events = emit.mock.calls.map(([event]) => event);
  expect(events.at(-1)).toMatchObject({
    type: `${phase}end`,
    id: events.at(-2).id,
    parentIds: events.at(-2).parentIds,
    data: { error: expect.any(Object) },
  });
  if (phase === 'summarize') expect(events.some((event) => event.type === 'queryend' && event.data.data)).toBe(true);
});
