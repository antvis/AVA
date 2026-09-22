import { describe, expect, it, vi } from 'vitest';
import { experimental_evaluate as evaluate, generateText } from 'ai';

import { analyze } from '../src/analysis';

import type { AnalysisEngine } from '../src/types';

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'One result.' }),
  experimental_evaluate: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn()),
}));

describe('directAnalysis', () => {
  it('uses Jev to route auto analysis', async () => {
    vi.mocked(evaluate).mockResolvedValueOnce({
      answers: { strategy: { type: 'choice', choice: 'direct', probabilities: { direct: 0.9, loop: 0.1 } } },
    } as any);
    vi.mocked(generateText).mockResolvedValueOnce({ text: 'One result.' } as any);

    const engine = {
      getDSL: vi.fn().mockResolvedValue('SELECT 1'),
      execute: vi.fn().mockResolvedValue({ data: [{ value: 1 }], schema: [{ name: 'value' }], rowCount: 1 }),
    } as unknown as AnalysisEngine;

    const result = await analyze(
      'Give me one',
      { strategy: { type: 'auto' } },
      {
        schema: { tables: [] },
        engine,
        llm: { model: 'test', apiKey: 'test' },
      }
    );

    expect(evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'typesafe-ai/jev',
        state: expect.stringContaining('User question:\nGive me one'),
      })
    );
    expect(engine.getDSL).toHaveBeenCalledOnce();
    expect(result.text).toBe('One result.');
  });

  it('routes complex auto analysis to the loop', async () => {
    vi.mocked(generateText).mockClear();
    vi.mocked(evaluate).mockResolvedValueOnce({
      answers: { strategy: { type: 'choice', choice: 'loop', probabilities: { direct: 0.1, loop: 0.9 } } },
    } as any);
    vi.mocked(generateText)
      .mockResolvedValueOnce({ text: '[SQL]\n```sql\nSELECT 1 AS value\n```' } as any)
      .mockResolvedValueOnce({ text: '[CONFIRM]\nVerified.' } as any);

    const engine = {
      language: { name: 'DuckDB SQL dialect', fence: 'sql' },
      execute: vi.fn().mockResolvedValue({ data: [{ value: 1 }], schema: [{ name: 'value' }], rowCount: 1 }),
    } as unknown as AnalysisEngine;

    const result = await analyze(
      'Investigate and verify the answer',
      { strategy: { type: 'auto' } },
      {
        schema: { tables: [] },
        engine,
        llm: { model: 'test', apiKey: 'test' },
      }
    );

    expect(generateText).toHaveBeenCalledTimes(2);
    expect(result.text).toBe('Verified.');
  });

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
        schema: { tables: [] },
        engine,
        llm: { model: 'test', apiKey: 'test' },
      }
    );

    expect(engine.getDSL).toHaveBeenCalledOnce();
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

  it('runs the explore, refine, SQL, and confirm loop', async () => {
    vi.mocked(generateText)
      .mockResolvedValueOnce({ text: '[EXPLORE]\n```sql\nSELECT DISTINCT region FROM data\n```' } as any)
      .mockResolvedValueOnce({ text: '[REFINE]\n### Next\n[SQL]' } as any)
      .mockResolvedValueOnce({ text: '[SQL]\n```sql\nSELECT region, AVG(revenue) AS average FROM data GROUP BY region\n```' } as any)
      .mockResolvedValueOnce({ text: '[CONFIRM]\n### Conclusion\nThe averages are verified.' } as any);

    const engine = {
      language: { name: 'DuckDB SQL dialect', fence: 'sql' },
      execute: vi
        .fn()
        .mockResolvedValueOnce({ data: [{ region: 'East' }], schema: [{ name: 'region' }], rowCount: 1 })
        .mockResolvedValueOnce({
          data: [{ region: 'East', average: 10 }],
          schema: [{ name: 'region' }, { name: 'average' }],
          rowCount: 1,
        }),
    } as unknown as AnalysisEngine;

    const result = await analyze(
      'Average revenue by region',
      { strategy: { type: 'loop' } },
      {
        schema: { tables: [] },
        engine,
        llm: { model: 'test', apiKey: 'test' },
      }
    );

    expect(engine.execute).toHaveBeenCalledTimes(2);
    expect(vi.mocked(generateText).mock.calls[0][0].prompt).toContain(
      'The runtime executes DuckDB SQL dialect.'
    );
    expect(result).toMatchObject({
      sql: 'SELECT region, AVG(revenue) AS average FROM data GROUP BY region',
      data: [{ region: 'East', average: 10 }],
      text: '### Conclusion\nThe averages are verified.',
    });
  });

  it('generates and adopts one final SQL after reaching maxSteps', async () => {
    vi.mocked(generateText)
      .mockClear()
      .mockResolvedValueOnce({ text: '[REFINE]' } as any)
      .mockResolvedValueOnce({ text: '[REFINE]' } as any)
      .mockResolvedValueOnce({ text: '[SQL]\n```sql\nSELECT 1 AS value\n```' } as any);

    const engine = {
      language: { name: 'DuckDB SQL dialect', fence: 'sql' },
      execute: vi.fn().mockResolvedValue({
        data: [{ value: 1 }],
        schema: [{ name: 'value' }],
        rowCount: 1,
      }),
    } as unknown as AnalysisEngine;

    const result = await analyze(
      'Give me one',
      { strategy: { type: 'loop', maxSteps: 2 } },
      {
        schema: { tables: [] },
        engine,
        llm: { model: 'test', apiKey: 'test' },
      }
    );

    expect(generateText).toHaveBeenCalledTimes(3);
    expect(vi.mocked(generateText).mock.calls[2][0].prompt).toContain('# ITERATION HISTORY\n\nAssistant:\n[REFINE]');
    expect(result).toMatchObject({
      sql: 'SELECT 1 AS value',
      data: [{ value: 1 }],
    });
  });

  it('forces one final SQL attempt when the model confirms too early', async () => {
    vi.mocked(generateText)
      .mockClear()
      .mockResolvedValueOnce({ text: '[CONFIRM]\n### Conclusion\nOne row.' } as any)
      .mockResolvedValueOnce({ text: '[SQL]\n```sql\nSELECT 1 AS value\n```' } as any);

    const engine = {
      language: { name: 'DuckDB SQL dialect', fence: 'sql' },
      execute: vi.fn().mockResolvedValue({
        data: [{ value: 1 }],
        schema: [{ name: 'value' }],
        rowCount: 1,
      }),
    } as unknown as AnalysisEngine;

    const result = await analyze(
      'Give me one',
      { strategy: { type: 'loop', maxSteps: 1 } },
      {
        schema: { tables: [] },
        engine,
        llm: { model: 'test', apiKey: 'test' },
      }
    );

    expect(generateText).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      sql: 'SELECT 1 AS value',
      data: [{ value: 1 }],
      text: '### Conclusion\nOne row.',
    });
  });
});
