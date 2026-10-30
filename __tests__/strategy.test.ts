import { describe, expect, it, vi } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import { createOpenAI } from '@ai-sdk/openai';

import { analyze } from '../src/analysis';
import { DuckDBQueryDialect } from '../src/query/duckdb';

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
    getDSL: vi.fn().mockResolvedValue({ dsl: 'SELECT 1' }),
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

function expectStepContexts(events: AnalysisEvent[]) {
  const steps = events.filter(({ type }) => type === 'stepstart');
  expect(steps.length).toBeGreaterThan(0);
  expect(new Set(steps.map(({ context }) => context.stepId)).size).toBe(steps.length);
  expect(new Set(events.map(({ context }) => context.eventId)).size).toBe(events.length);

  const stack: AnalysisEvent[] = [];
  let step = -1;
  for (const event of events) {
    if (event.type === 'stepstart') {
      expect(stack).toHaveLength(0);
      step++;
    }
    expect(event.context.stepId).toEqual(expect.any(String));
    expect(event.context.stepId).toBe(steps[step].context.stepId);
    expect(event.context.parentStepIds).toEqual(step === 0 ? [] : [steps[step - 1].context.stepId]);
    if (event.type === 'stepstart' || event.type === 'stepend') {
      const phase = event.type === 'stepstart' ? 'start' : 'end';
      expect(event.context.eventId).toBe(`${event.context.stepId}:${phase}`);
    } else {
      expect(stack[0]?.type).toBe('stepstart');
    }

    if (event.type.endsWith('start')) {
      expect(event.context.eventId).toMatch(/^[^:]+:start$/);
      stack.push(event);
    } else {
      const start = stack.pop();
      expect(event.type).toBe(start.type.replace(/start$/, 'end'));
      expect(event.context).toEqual({
        ...start.context,
        eventId: start.context.eventId.replace(/:start$/, ':end'),
      });
    }
  }
  expect(stack).toHaveLength(0);
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

    expect(result).toEqual({
      ...execution,
      query: 'Give me one',
      sql: 'SELECT 1',
      text: 'One result.',
    });
    expect(engine.getDSL).toHaveBeenCalledExactlyOnceWith('Give me one', runtime.dataModel);
    expect(engine.execute).toHaveBeenCalledExactlyOnceWith('SELECT 1', config);
    expect(doGenerate).toHaveBeenCalledOnce();
    expect(model.doGenerateCalls[0].responseFormat).toEqual({ type: 'text' });

    const allEvents = emit.mock.calls.map(([event]) => event);
    expectStepContexts(allEvents);
    expect(allEvents[0].data).toEqual({ step: 0 });
    expect(allEvents.at(-1).data).toEqual({ step: 0, action: 'SQL', text: narrative.conclusion });
    const events = allEvents.slice(1, -1);
    expect(events.map(({ type }) => type)).toEqual([
      'translatestart',
      'translateend',
      'querystart',
      'queryend',
      'summarizestart',
      'summarizeend',
    ]);
    expect(events[4].data.queryId).toBe(events[3].context.eventId);
    expect(events[5].data).toMatchObject({ ...narrative, usage: { inputTokens: 10, outputTokens: 5 } });
  });

  it.each([false, true])('summarizes through an endpoint that rejects response_format (fenced: %s)', async (fenced) => {
    const { runtime, emit } = setup();
    const requests: Record<string, unknown>[] = [];
    const model = createOpenAI({
      apiKey: 'test-only',
      baseURL: 'https://example.invalid/v1',
      fetch: async (_input, init) => {
        const body = JSON.parse(String(init?.body));
        requests.push(body);
        if ('response_format' in body) {
          return new Response(JSON.stringify({ error: { message: 'This response_format type is unavailable now' } }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          });
        }
        const text = JSON.stringify(narrative);
        return new Response(
          JSON.stringify({
            id: 'test',
            created: 0,
            model: 'test-model',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: fenced ? '```json\n' + text + '\n```' : text },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          }),
          { headers: { 'content-type': 'application/json' } }
        );
      },
    }).chat('test-model');

    const result = await analyze('Give me one', {}, { ...runtime, llm: { model, maxRetries: 0 } });

    expect(result.text).toBe(narrative.conclusion);
    expect(requests).toHaveLength(1);
    expect(requests[0]).not.toHaveProperty('response_format');
    expect(emit.mock.calls.at(-2)[0]).toMatchObject({ type: 'summarizeend', data: narrative });
  });

  it.each([
    ['bare keys', '{queryExplanation: "Return the constant 1.", conclusion: "One result."}'],
    ['single quotes', "{'queryExplanation': 'Return the constant 1.', 'conclusion': 'One result.'}"],
    ['comments', '{/* summary */ "queryExplanation": "Return the constant 1.", "conclusion": "One result."}'],
    ['trailing comma', '{"queryExplanation": "Return the constant 1.", "conclusion": "One result.",}'],
    ['fenced bare keys', '```json\n{queryExplanation: "Return the constant 1.", conclusion: "One result.",}\n```'],
  ])('repairs %s without another model call or query', async (_, text) => {
    const { runtime, engine, doGenerate, emit } = setup();
    doGenerate.mockResolvedValue(response(text));

    const result = await analyze('Give me one', {}, runtime);

    expect(result).toEqual({ ...execution, query: 'Give me one', sql: 'SELECT 1', text: narrative.conclusion });
    expect(doGenerate).toHaveBeenCalledOnce();
    expect(engine.execute).toHaveBeenCalledOnce();
    expect(emit.mock.calls.at(-2)[0]).toMatchObject({
      type: 'summarizeend',
      data: { ...narrative, usage: { inputTokens: 10, outputTokens: 5 } },
    });
  });

  it.each([false, true])('preserves quoted content while repairing bare keys: %s', async (repair) => {
    const { runtime, doGenerate, emit } = setup();
    const content = {
      queryExplanation: 'SQL: SELECT "value"; text: {bare: 1,}; array: [1,]; path: C:\\tmp\\file; \\"quote", after: 2',
      conclusion: '中文结论\n下一行：{"conclusion": "不改动"}',
    };
    const text = repair
      ? `{queryExplanation: ${JSON.stringify(content.queryExplanation)}, conclusion: ${JSON.stringify(
          content.conclusion
        )},}`
      : JSON.stringify(content);
    doGenerate.mockResolvedValue(response(text));

    expect(await analyze('Give me one', {}, runtime)).toMatchObject({ text: content.conclusion });
    expect(emit.mock.calls.at(-2)[0]).toMatchObject({ type: 'summarizeend', data: content });
  });

  it.each([
    ['empty response', '', 'could not parse the response'],
    ['non-JSON response', 'The answer is one.', 'did not match schema'],
    ['incomplete summary', '{queryExplanation: "Return 1."', 'did not match schema'],
    ['missing field', '{queryExplanation: "Return 1.",}', 'did not match schema'],
    ['empty conclusion', '{queryExplanation: "Return 1.", conclusion: "   ",}', 'did not match schema'],
    ['wrong field type', '{queryExplanation: "Return 1.", conclusion: 1,}', 'did not match schema'],
    [
      'invalid optional field',
      '{queryExplanation: "Return 1.", conclusion: "One.", nextStep: [],}',
      'did not match schema',
    ],
  ])('still rejects %s after repair', async (_, text, error) => {
    const { runtime, engine, doGenerate, emit } = setup();
    doGenerate.mockResolvedValue(response(text));

    await expect(analyze('Give me one', {}, runtime)).rejects.toThrow(error);

    expect(engine.execute).toHaveBeenCalledOnce();
    expect(doGenerate).toHaveBeenCalledOnce();
    expect(emit.mock.calls.at(-2)[0]).toMatchObject({
      type: 'summarizeend',
      data: { error: { name: 'AI_NoObjectGeneratedError' } },
    });
    expect(emit.mock.calls.find(([event]) => event.type === 'stepend')[0]).toMatchObject({
      type: 'stepend',
      data: { step: 0, error: { name: 'AI_NoObjectGeneratedError' } },
    });
  });

  it('skips the model and summary events when includeSummary is false', async () => {
    const { runtime, engine, doGenerate, emit } = setup();

    const result = await analyze('Give me one', { includeSummary: false }, runtime);

    expect(result).toMatchObject({ ...execution, sql: 'SELECT 1', text: '' });
    expect(engine.execute).toHaveBeenCalledOnce();
    expect(doGenerate).not.toHaveBeenCalled();
    expect(emit.mock.calls.some(([event]) => event.type.startsWith('summarize'))).toBe(false);
    const events = emit.mock.calls.map(([event]) => event);
    expect(events.map(({ type }) => type)).toEqual([
      'stepstart',
      'translatestart',
      'translateend',
      'querystart',
      'queryend',
      'stepend',
    ]);
    expect(events.at(-1).data).toEqual({ step: 0, action: 'SQL', text: '' });
    expectStepContexts(events);
  });

  it('reports DSL generation usage for each execution attempt', async () => {
    const { runtime, engine, emit } = setup();
    const model = new MockLanguageModelV4({
      doGenerate: vi.fn().mockResolvedValueOnce(response('BAD SQL')).mockResolvedValueOnce(response('SELECT 1')),
    });
    const dialect = new DuckDBQueryDialect({ model });
    engine.getDSL.mockImplementation((query, dataModel) => dialect.getDSL(query, dataModel));
    engine.execute.mockRejectedValueOnce(new Error('Invalid SQL'));

    await analyze('Give me one', { includeSummary: false, strategy: { type: 'direct', maxRetries: 1 } }, runtime);

    const translations = emit.mock.calls.map(([event]) => event).filter(({ type }) => type === 'translateend');
    expect(translations.map(({ data }) => data)).toEqual([
      expect.objectContaining({ dsl: 'BAD SQL', usage: expect.objectContaining({ inputTokens: 10, outputTokens: 5 }) }),
      expect.objectContaining({
        dsl: 'SELECT 1',
        usage: expect.objectContaining({ inputTokens: 10, outputTokens: 5 }),
      }),
    ]);
  });

  it('keeps usage separate for concurrent translations on the same engine', async () => {
    const { runtime, engine } = setup();
    let releaseFirst: () => void = () => {};
    const firstWait = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let calls = 0;
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        const call = ++calls;
        if (call === 1) await firstWait;
        else releaseFirst();
        const result = response(`SELECT ${call}`);
        result.usage.inputTokens.total = call * 10;
        return result;
      },
    });
    const dialect = new DuckDBQueryDialect({ model });
    engine.getDSL.mockImplementation((query, dataModel) => dialect.getDSL(query, dataModel));
    const firstEmit = vi.fn();
    const secondEmit = vi.fn();
    await Promise.all([
      analyze('First', { includeSummary: false }, { ...runtime, emit: firstEmit }),
      analyze('Second', { includeSummary: false }, { ...runtime, emit: secondEmit }),
    ]);
    expect(firstEmit.mock.calls.find(([event]) => event.type === 'translateend')?.[0].data).toMatchObject({
      dsl: 'SELECT 1',
      usage: { inputTokens: 10 },
    });
    expect(secondEmit.mock.calls.find(([event]) => event.type === 'translateend')?.[0].data).toMatchObject({
      dsl: 'SELECT 2',
      usage: { inputTokens: 20 },
    });
  });

  it('retries a failed query with its DSL and error as correction context', async () => {
    const { runtime, engine, doGenerate, emit } = setup();
    engine.getDSL.mockResolvedValueOnce({ dsl: 'BAD SQL' });
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
    expectStepContexts(events);
    expect(events.filter(({ type }) => type === 'stepstart')).toHaveLength(1);
    expect(events.at(-1).data).toEqual({ step: 0, action: 'SQL', text: narrative.conclusion });
    expect(events.find(({ type }) => type === 'summarizestart').data.queryId).toBe(queryEnds[1].context.eventId);
  });

  it.each([0, 2])('stops after %s correction retries', async (maxRetries) => {
    const { runtime, engine, doGenerate, emit } = setup();
    engine.execute.mockRejectedValue(new Error('Invalid SQL'));

    await expect(analyze('Give me one', { strategy: { type: 'direct', maxRetries } }, runtime)).rejects.toThrow(
      'Invalid SQL'
    );

    expect(engine.getDSL).toHaveBeenCalledTimes(maxRetries + 1);
    expect(engine.execute).toHaveBeenCalledTimes(maxRetries + 1);
    expect(doGenerate).not.toHaveBeenCalled();
    const events = emit.mock.calls.map(([event]) => event);
    expectStepContexts(events);
    expect(events.filter(({ type }) => type === 'stepstart')).toHaveLength(1);
    expect(events.at(-1)).toMatchObject({ type: 'stepend', data: { step: 0, error: { message: 'Invalid SQL' } } });
  });

  it.each(['translate', 'query', 'summarize'])('propagates %s failures and closes the event', async (phase) => {
    const { runtime, engine, doGenerate, emit } = setup();
    if (phase === 'translate') engine.getDSL.mockRejectedValue(new Error('Translation failed'));
    if (phase === 'query') engine.execute.mockRejectedValue(new Error('Query failed'));
    if (phase === 'summarize') doGenerate.mockResolvedValue(response('{"conclusion":""}'));

    await expect(analyze('Question', { strategy: { type: 'direct', maxRetries: 0 } }, runtime)).rejects.toThrow();

    const events = emit.mock.calls.map(([event]) => event);
    expectStepContexts(events);
    expect(events.at(-3).type).toBe(`${phase}start`);
    expect(events.at(-2)).toMatchObject({
      type: `${phase}end`,
      context: {
        ...events.at(-3).context,
        eventId: events.at(-3).context.eventId.replace(/:start$/, ':end'),
      },
      data: { error: expect.any(Object) },
    });
    expect(events.at(-1)).toMatchObject({ type: 'stepend', data: { step: 0, error: events.at(-2).data.error } });
    expect(engine.getDSL).toHaveBeenCalledOnce();
    expect(engine.execute).toHaveBeenCalledTimes(phase === 'translate' ? 0 : 1);
    expect(doGenerate).toHaveBeenCalledTimes(phase === 'summarize' ? 1 : 0);
  });
});

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
  expectStepContexts(emit.mock.calls.map(([event]) => event));
});

it('wraps loop queries in steps across exploration, refinement, and confirmation', async () => {
  const { runtime, engine, doGenerate, model, emit } = setup();
  doGenerate
    .mockResolvedValueOnce(response('[EXPLORE]\n```sql\nBAD SQL\n```\n```sql\nSELECT 2\n```'))
    .mockResolvedValueOnce(response('[REFINE] Use the verified values.'))
    .mockResolvedValueOnce(response('[SQL]\n```sql\nSELECT 1\n```'))
    .mockResolvedValueOnce(response('[CONFIRM] Result verified.'));
  engine.execute.mockRejectedValueOnce(new Error('Invalid SQL'));

  const result = await analyze('Give me one', { strategy: { type: 'loop', maxSteps: 4 } }, runtime);

  expect(result).toMatchObject({ ...execution, sql: 'SELECT 1', text: 'Result verified.' });
  const events = emit.mock.calls.map(([event]) => event);
  expect(events.map(({ type }) => type)).toEqual([
    'stepstart',
    'querystart',
    'queryend',
    'querystart',
    'queryend',
    'stepend',
    'stepstart',
    'stepend',
    'stepstart',
    'querystart',
    'queryend',
    'stepend',
    'stepstart',
    'stepend',
  ]);
  expect(events.filter(({ type }) => type === 'stepend').map(({ data }) => data.action)).toEqual([
    'EXPLORE',
    'REFINE',
    'SQL',
    'CONFIRM',
  ]);
  expect(events.filter(({ type }) => type === 'stepend').map(({ data }) => data.text)).toEqual([
    '```sql\nBAD SQL\n```\n```sql\nSELECT 2\n```',
    'Use the verified values.',
    '```sql\nSELECT 1\n```',
    'Result verified.',
  ]);
  expect(JSON.stringify(model.doGenerateCalls[3].prompt)).toContain('Assistant:\\n[REFINE] Use the verified values.');
  expect(events.filter(({ type }) => type === 'querystart').map(({ data }) => data.dsl)).toEqual([
    'BAD SQL',
    'SELECT 2',
    'SELECT 1',
  ]);
  expect(events.find(({ type }) => type === 'queryend').data).toMatchObject({
    error: { message: 'Invalid SQL' },
  });
  expect(events.filter(({ type }) => type === 'stepend').every(({ data }) => !data.error)).toBe(true);
  expect(events.at(-1).data).toEqual({ step: 3, action: 'CONFIRM', text: 'Result verified.' });
  expectStepContexts(events);
});

it('links the loop fallback to the previous step', async () => {
  const { runtime, doGenerate, emit } = setup();
  doGenerate
    .mockResolvedValueOnce(response('[REFINE] Need an answer query.'))
    .mockResolvedValueOnce(response('[SQL]\n```sql\nSELECT 1\n```'));

  await analyze('Give me one', { strategy: { type: 'loop', maxSteps: 1 } }, runtime);

  const events = emit.mock.calls.map(([event]) => event);
  expect(events.filter(({ type }) => type === 'stepstart').map(({ data }) => data)).toEqual([
    { step: 0 },
    { step: 1, finalAttempt: true },
  ]);
  expect(events.at(-1).data).toEqual({
    step: 1,
    finalAttempt: true,
    action: 'SQL',
    text: '```sql\nSELECT 1\n```',
  });
  expectStepContexts(events);
});

it('closes an early confirmation step before continuing to a query', async () => {
  const { runtime, doGenerate, emit } = setup();
  doGenerate
    .mockResolvedValueOnce(response('[CONFIRM] No query yet.'))
    .mockResolvedValueOnce(response('[SQL]\n```sql\nSELECT 1\n```'));

  await analyze('Question', { strategy: { type: 'loop', maxSteps: 2 } }, runtime);

  const events = emit.mock.calls.map(([event]) => event);
  expect(events.map(({ type }) => type)).toEqual([
    'stepstart',
    'stepend',
    'stepstart',
    'querystart',
    'queryend',
    'stepend',
  ]);
  expect(events[1].data).toEqual({ step: 0, action: 'CONFIRM', text: 'No query yet.' });
  expectStepContexts(events);
});

it('ends a recoverable failed SQL step before the fallback starts', async () => {
  const { runtime, engine, doGenerate, emit } = setup();
  doGenerate.mockResolvedValue(response('[SQL]\n```sql\nSELECT 1\n```'));
  engine.execute.mockRejectedValueOnce(new Error('Query failed'));

  await analyze('Question', { strategy: { type: 'loop', maxSteps: 1 } }, runtime);

  const events = emit.mock.calls.map(([event]) => event);
  const ends = events.filter(({ type }) => type === 'stepend');
  expect(ends.map(({ data }) => data)).toEqual([
    { step: 0, action: 'SQL', text: '```sql\nSELECT 1\n```' },
    { step: 1, finalAttempt: true, action: 'SQL', text: '```sql\nSELECT 1\n```' },
  ]);
  expect(events[2].data.error.message).toBe('Query failed');
  expectStepContexts(events);
});

it.each([
  ['model', 1],
  ['model', 0],
  ['parse', 1],
  ['parse', 0],
  ['query', 0],
] as const)('closes a failed loop %s event with context at maxSteps=%s', async (phase, maxSteps) => {
  const { runtime, engine, doGenerate, emit } = setup();
  if (phase === 'model') doGenerate.mockRejectedValueOnce(new Error('Model failed'));
  else if (phase === 'parse') doGenerate.mockResolvedValueOnce(response('Invalid action'));
  else {
    doGenerate.mockResolvedValueOnce(response('[SQL]\n```sql\nSELECT 1\n```'));
    engine.execute.mockRejectedValueOnce(new Error('Query failed'));
  }

  let failure: Error | undefined;
  try {
    await analyze('Question', { strategy: { type: 'loop', maxSteps } }, runtime);
  } catch (error) {
    failure = error as Error;
  }
  expect(failure).toBeInstanceOf(Error);

  const events = emit.mock.calls.map(([event]) => event);
  expect(events.at(-1)).toMatchObject({ type: 'stepend', data: { step: 0, error: { message: failure.message } } });
  if (maxSteps === 0) expect(events.at(-1).data.finalAttempt).toBe(true);
  if (phase === 'query') {
    expect(events.map(({ type }) => type)).toEqual(['stepstart', 'querystart', 'queryend', 'stepend']);
    expect(events.at(-2).data.error.message).toBe('Query failed');
  }
  expectStepContexts(events);
});
