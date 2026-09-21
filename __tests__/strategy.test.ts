import { describe, expect, it, vi } from 'vitest';

import { analyze } from '../src/analysis';

import type { AnalysisEngine } from '../src/types';

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'One result.' }),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn()),
}));

describe('directAnalysis', () => {
  it('generates and executes exactly one DSL statement', async () => {
    const queryResult = {
      data: [{ value: 1 }],
      truncated: false,
      schema: [{ name: 'value', type: 'INTEGER' }],
      rowCount: 1,
    };
    const engine = {
      getDSL: vi.fn().mockResolvedValue('SELECT 1'),
      execute: vi.fn().mockResolvedValue(queryResult),
    } as unknown as AnalysisEngine;

    const result = await analyze(
      'Give me one',
      { strategy: { type: 'direct' }, maxRows: 5 },
      {
        schema: { tables: [] },
        engine,
        llm: { model: 'test', apiKey: 'test' },
      }
    );

    expect(engine.getDSL).toHaveBeenCalledOnce();
    expect(engine.execute).toHaveBeenCalledWith('SELECT 1', { maxRows: 5 });
    expect(result).toMatchObject({
      query: 'Give me one',
      data: [{ value: 1 }],
      truncated: false,
      schema: [{ name: 'value', type: 'INTEGER' }],
      rowCount: 1,
      sql: 'SELECT 1',
      text: 'One result.',
    });
  });
});
