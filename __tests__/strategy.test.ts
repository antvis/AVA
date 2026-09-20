import { describe, expect, it, vi } from 'vitest';

import { analyze } from '../src/analysis';

import type { AnalysisEngine } from '../src/types';

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'One result.' }),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn()),
}));

describe('singleQueryAnalysis', () => {
  it('generates and executes exactly one DSL statement', async () => {
    const engine = {
      getDSL: vi.fn().mockResolvedValue('SELECT 1'),
      execute: vi.fn().mockResolvedValue([{ value: 1 }]),
    } as unknown as AnalysisEngine;

    const result = await analyze(
      'Give me one',
      { strategy: { type: 'single-query' } },
      {
        schema: { tables: [] },
        engine,
        llm: { model: 'test', apiKey: 'test' },
      }
    );

    expect(engine.getDSL).toHaveBeenCalledOnce();
    expect(engine.execute).toHaveBeenCalledWith('SELECT 1');
    expect(result).toEqual({
      query: 'Give me one',
      data: [{ value: 1 }],
      sql: 'SELECT 1',
      text: 'One result.',
    });
  });
});
