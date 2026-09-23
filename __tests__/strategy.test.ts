import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { analyze } from '../src/analysis';

import type { AnalysisEngine } from '../src/types';

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'One result.' }),
  experimental_evaluate: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({ chat: vi.fn() })),
}));

beforeEach(() => vi.clearAllMocks());

describe('directAnalysis', () => {
  it('generates and executes exactly one DSL statement', async () => {
    const queryResult = {
      data: [{ value: 1 }],
      schema: [{ name: 'value', type: 'INTEGER' }],
      rowCount: 1,
    };
    const engine = {
      getDSL: vi.fn().mockResolvedValue('SELECT 1'),
      execute: vi.fn().mockResolvedValue(queryResult),
    } as unknown as AnalysisEngine;

    const result = await analyze(
      'Give me one',
      { strategy: { type: 'direct' }, maxRows: 5, maxResultBytes: 1024 },
      {
        context: { schema: { tables: [] } },
        engine,
        llm: { model: 'test', apiKey: 'test' },
      }
    );

    expect(engine.getDSL).toHaveBeenCalledOnce();
    expect(engine.getDSL).toHaveBeenCalledWith('Give me one', { schema: { tables: [] } });
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
    {
      context: { schema: { tables: [] } },
      engine,
      llm: { model: 'test' },
    }
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
  const result = await analyze(
    'Give me one',
    { strategy: { type: 'loop', maxSteps }, includeSummary: false },
    {
      context: { schema: { tables: [] } },
      engine,
      llm: { model: 'test' },
    }
  );
  expect(result).toMatchObject({ data: [{ value: 1 }], sql: 'SELECT 1', text: '' });
  expect(engine.execute).toHaveBeenCalledOnce();
  expect(generateText).toHaveBeenCalledTimes(maxSteps === 2 ? 2 : 1);
  expect(vi.mocked(generateText).mock.calls[0][0].prompt).toContain('without a summary or conclusion');
});
