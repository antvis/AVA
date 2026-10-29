import { describe, expect, it, vi } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';

import { analyze } from '../src/analysis';

import type { AnalysisEngine } from '../src/types';
import type { AnalysisEvent } from '../src/event';

const narrative = { queryExplanation: 'Return the constant 1.', conclusion: 'One result.' };
const execution = { data: [{ value: 1 }], schema: [{ name: 'value', type: 'INTEGER' }], rowCount: 1 };

function response(text: string) {
  return {
    content: [{ type: 'text' as const, text }],
    finishReason: { unified: 'stop' as const, raw: 'stop' },
    usage: {
      inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 5, text: 5, reasoning: 0 },
    },
    warnings: [],
  };
}

function setup() {
  const doGenerate = vi.fn<MockLanguageModelV4['doGenerate']>().mockResolvedValue(response(JSON.stringify(narrative)));
  const model = new MockLanguageModelV4({ doGenerate });
  const engine = {
    language: { name: 'SQL', fence: 'sql' },
    getDSL: vi.fn().mockResolvedValue('SELECT 1'),
    execute: vi.fn().mockResolvedValue(execution),
  };
  const emit = vi.fn();
  const runtime = {
    engine: engine as unknown as AnalysisEngine,
    dataModel: { models: [] },
    llm: { model, maxRetries: 0 },
    emit,
  };
  return { runtime, engine, doGenerate, model, emit };
}

describe('directAnalysis', () => {
  it.each([
    ['plain JSON', JSON.stringify(narrative)],
    ['fenced JSON', '```json\n' + JSON.stringify(narrative) + '\n```'],
  ])('executes one query and summarizes %s', async (_, text) => {
    const { runtime, engine, doGenerate, model, emit } = setup();
    doGenerate.mockResolvedValue(response(text));
    const config = { maxRows: 5, maxResultBytes: 1024 };

    const result = await analyze('Give me one', config, runtime);

    expect(result).toMatchObject({
      ...execution,
      ...narrative,
      query: 'Give me one',
      sql: 'SELECT 1',
      text: 'One result.',
    });
    expect(engine.getDSL).toHaveBeenCalledExactlyOnceWith('Give me one', runtime.dataModel);
    expect(engine.execute).toHaveBeenCalledExactlyOnceWith('SELECT 1', config);
    expect(doGenerate).toHaveBeenCalledOnce();
    expect(model.doGenerateCalls[0].providerOptions.openai).toMatchObject({ strictJsonSchema: false });

    const events = emit.mock.calls.map(([event]) => event);
    expect(events.map(({ type }) => type)).toEqual([
      'translatestart',
      'translateend',
      'querystart',
      'queryend',
      'summarizestart',
      'summarizeend',
    ]);
    for (let i = 0; i < events.length; i += 2) {
      expect(events[i].context.eventId).toMatch(/^[^:]+:start$/);
      expect(events[i + 1].context).toEqual({
        ...events[i].context,
        eventId: events[i].context.eventId.replace(/:start$/, ':end'),
      });
      expect(events[i].context.stepId).toBe(events[0].context.stepId);
    }
    expect(new Set(events.map(({ context }) => context.eventId)).size).toBe(events.length);
    expect(events[4].data.queryId).toBe(events[3].context.eventId);
    expect(events[5].data).toMatchObject({ ...narrative, usage: { inputTokens: 10, outputTokens: 5 } });
  });

  it('skips the model and summary events when includeSummary is false', async () => {
    const { runtime, engine, doGenerate, emit } = setup();

    const result = await analyze('Give me one', { includeSummary: false }, runtime);

    expect(result).toMatchObject({ ...execution, sql: 'SELECT 1', text: '' });
    expect(engine.execute).toHaveBeenCalledOnce();
    expect(doGenerate).not.toHaveBeenCalled();
    expect(emit.mock.calls.some(([event]) => event.type.startsWith('summarize'))).toBe(false);
  });

  it('retries a failed query with its DSL and error as correction context', async () => {
    const { runtime, engine, doGenerate, emit } = setup();
    engine.getDSL.mockResolvedValueOnce('BAD SQL');
    engine.execute.mockRejectedValueOnce(new Error('Invalid SQL'));

    const result = await analyze('Give me one', { strategy: { type: 'direct', maxRetries: 1 } }, runtime);

    expect(engine.getDSL).toHaveBeenCalledTimes(2);
    const correction = engine.getDSL.mock.calls[1][0];
    expect(correction).toContain('Give me one');
    expect(correction).toContain('BAD SQL');
    expect(correction).toContain('Invalid SQL');
    expect(engine.execute).toHaveBeenCalledTimes(2);
    expect(engine.execute).toHaveBeenLastCalledWith('SELECT 1', expect.any(Object));
    expect(result).toMatchObject({ ...execution, sql: 'SELECT 1', text: narrative.conclusion });
    expect(doGenerate).toHaveBeenCalledOnce();

    const events = emit.mock.calls.map(([event]) => event);
    const queryEnds = events.filter(({ type }) => type === 'queryend');
    expect(queryEnds).toHaveLength(2);
    expect(queryEnds[0].data).toHaveProperty('error');
    expect(new Set(events.map(({ context }) => context.eventId)).size).toBe(events.length);
    for (let i = 0; i < events.length; i += 2) {
      expect(events[i].context.eventId).toMatch(/^[^:]+:start$/);
      expect(events[i + 1].context).toEqual({
        ...events[i].context,
        eventId: events[i].context.eventId.replace(/:start$/, ':end'),
      });
      expect(events[i].context.stepId).toBe(events[0].context.stepId);
    }
    expect(events.find(({ type }) => type === 'summarizestart').data.queryId).toBe(queryEnds[1].context.eventId);
  });

  it.each([0, 2])('stops after %s correction retries', async (maxRetries) => {
    const { runtime, engine, doGenerate } = setup();
    engine.execute.mockRejectedValue(new Error('Invalid SQL'));

    await expect(analyze('Give me one', { strategy: { type: 'direct', maxRetries } }, runtime)).rejects.toThrow(
      'Invalid SQL'
    );

    expect(engine.getDSL).toHaveBeenCalledTimes(maxRetries + 1);
    expect(engine.execute).toHaveBeenCalledTimes(maxRetries + 1);
    expect(doGenerate).not.toHaveBeenCalled();
  });

  it.each(['translate', 'query', 'summarize'])('propagates %s failures and closes the event', async (phase) => {
    const { runtime, engine, doGenerate, emit } = setup();
    if (phase === 'translate') engine.getDSL.mockRejectedValue(new Error('Translation failed'));
    if (phase === 'query') engine.execute.mockRejectedValue(new Error('Query failed'));
    if (phase === 'summarize') doGenerate.mockResolvedValue(response('{"conclusion":""}'));

    await expect(analyze('Question', { strategy: { type: 'direct', maxRetries: 0 } }, runtime)).rejects.toThrow();

    const events = emit.mock.calls.map(([event]) => event);
    expect(events.at(-2).type).toBe(`${phase}start`);
    expect(events.at(-1)).toMatchObject({
      type: `${phase}end`,
      context: {
        ...events.at(-2).context,
        eventId: events.at(-2).context.eventId.replace(/:start$/, ':end'),
      },
      data: { error: expect.any(Object) },
    });
    expect(engine.getDSL).toHaveBeenCalledOnce();
    expect(engine.execute).toHaveBeenCalledTimes(phase === 'translate' ? 0 : 1);
    expect(doGenerate).toHaveBeenCalledTimes(phase === 'summarize' ? 1 : 0);
  });
});

function expectLoopContexts(events: AnalysisEvent[]) {
  const steps = events.filter(({ type }) => type === 'reasonstart');
  expect(steps.length).toBeGreaterThan(0);
  expect(new Set(steps.map(({ context }) => context.stepId)).size).toBe(steps.length);
  expect(new Set(events.map(({ context }) => context.eventId)).size).toBe(events.length);

  let step = -1;
  for (let i = 0; i < events.length; i += 2) {
    const start = events[i];
    const end = events[i + 1];
    if (start.type === 'reasonstart') step++;

    expect(start.context.eventId).toMatch(/^[^:]+:start$/);
    expect(start.context.stepId).toEqual(expect.any(String));
    expect(start.context.stepId).toBe(steps[step].context.stepId);
    expect(start.context.parentStepIds).toEqual(step === 0 ? [] : [steps[step - 1].context.stepId]);
    expect(end.type).toBe(start.type.replace(/start$/, 'end'));
    expect(end.context).toEqual({
      ...start.context,
      eventId: start.context.eventId.replace(/:start$/, ':end'),
    });
  }
}

it.each([0, 1, 2])('loop omits summary with maxSteps=%s, retaining verification when possible', async (maxSteps) => {
  const { runtime, engine, doGenerate, model, emit } = setup();
  doGenerate
    .mockResolvedValueOnce(response('[SQL]\n```sql\nSELECT 1\n```'))
    .mockResolvedValueOnce(response('[CONFIRM] Result verified.'));

  const result = await analyze('Give me one', { strategy: { type: 'loop', maxSteps }, includeSummary: false }, runtime);

  expect(result).toMatchObject({ ...execution, sql: 'SELECT 1', text: '' });
  expect(engine.execute).toHaveBeenCalledOnce();
  expect(engine.getDSL).not.toHaveBeenCalled();
  expect(doGenerate).toHaveBeenCalledTimes(maxSteps === 2 ? 2 : 1);
  expect(JSON.stringify(model.doGenerateCalls[0].prompt)).toContain('without a summary or conclusion');
  expectLoopContexts(emit.mock.calls.map(([event]) => event));
});

it('groups loop reasoning and queries by step across exploration, refinement, and confirmation', async () => {
  const { runtime, engine, doGenerate, emit } = setup();
  doGenerate
    .mockResolvedValueOnce(response('[EXPLORE]\n```sql\nBAD SQL\n```\n```sql\nSELECT 2\n```'))
    .mockResolvedValueOnce(response('[REFINE] Use the verified values.'))
    .mockResolvedValueOnce(response('[SQL]\n```sql\nSELECT 1\n```'))
    .mockResolvedValueOnce(response('[CONFIRM] Result verified.'));
  engine.execute.mockRejectedValueOnce(new Error('Invalid SQL'));

  const result = await analyze('Give me one', { strategy: { type: 'loop', maxSteps: 4 } }, runtime);

  expect(result).toMatchObject({ ...execution, sql: 'SELECT 1', text: 'Result verified.' });
  const events = emit.mock.calls.map(([event]) => event);
  expect(events.filter(({ type }) => type === 'reasonend').map(({ data }) => data.action)).toEqual([
    'EXPLORE',
    'REFINE',
    'SQL',
    'CONFIRM',
  ]);
  expect(events.filter(({ type }) => type === 'querystart').map(({ data }) => data.dsl)).toEqual([
    'BAD SQL',
    'SELECT 2',
    'SELECT 1',
  ]);
  expect(events.find(({ type }) => type === 'queryend').data).toMatchObject({
    error: { message: 'Invalid SQL' },
  });
  expectLoopContexts(events);
});

it('links the loop fallback to the previous step', async () => {
  const { runtime, doGenerate, emit } = setup();
  doGenerate
    .mockResolvedValueOnce(response('[REFINE] Need an answer query.'))
    .mockResolvedValueOnce(response('[SQL]\n```sql\nSELECT 1\n```'));

  await analyze('Give me one', { strategy: { type: 'loop', maxSteps: 1 } }, runtime);

  const events = emit.mock.calls.map(([event]) => event);
  expect(events.filter(({ type }) => type === 'reasonstart').map(({ data }) => data)).toEqual([
    { step: 0 },
    { step: 1, finalAttempt: true },
  ]);
  expectLoopContexts(events);
});

it.each([
  ['reason', 1],
  ['reason', 0],
  ['query', 0],
] as const)('closes a failed loop %s event with context at maxSteps=%s', async (phase, maxSteps) => {
  const { runtime, engine, doGenerate, emit } = setup();
  if (phase === 'reason') doGenerate.mockRejectedValueOnce(new Error('Reasoning failed'));
  else {
    doGenerate.mockResolvedValueOnce(response('[SQL]\n```sql\nSELECT 1\n```'));
    engine.execute.mockRejectedValueOnce(new Error('Query failed'));
  }

  await expect(analyze('Question', { strategy: { type: 'loop', maxSteps } }, runtime)).rejects.toThrow();

  const events = emit.mock.calls.map(([event]) => event);
  expect(events.at(-1)).toMatchObject({ type: `${phase}end`, data: { error: expect.any(Object) } });
  expectLoopContexts(events);
});
