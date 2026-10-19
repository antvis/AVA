import { describe, expect, it, vi } from 'vitest';
import { MockLanguageModelV3 } from 'ai/test';
import { z } from 'zod/v4';

import { apexAnalysis, resultKey, votingLeaders } from '../src/analysis/apex';
import { generateCandidate } from '../src/analysis/apex/agent';
import { retrieveGuidance } from '../src/analysis/apex/guidance';
import { apexRuntime, observation, parallelMap } from '../src/analysis/apex/runtime';
import { columns, connectSchema, prune, schemaBatches } from '../src/analysis/apex/schema';
import { DuckDBEngine } from '../src/duckdb';

import type { AnalysisEngine, ApexCandidate, Schema } from '../src/types';

const schema: Schema = {
  tables: [
    {
      name: 'orders',
      fields: ['customer', 'tenant', 'amount', 'noise'].map((name) => ({ name, type: 'INTEGER' })),
      indexes: [],
      columnCount: 4,
    },
    {
      name: 'customers',
      fields: ['id', 'tenant', 'name'].map((name) => ({ name, type: 'VARCHAR' })),
      indexes: [],
      columnCount: 3,
    },
  ],
  relations: [
    {
      kind: 'foreign-key',
      from: { table: 'orders', columns: ['customer', 'tenant'] },
      to: { table: 'customers', columns: ['id', 'tenant'] },
    },
  ],
};
const result = { schema: [{ name: 'total', type: 'INTEGER' }], data: [{ total: 3 }], rowCount: 1 };
const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};
const text = (value: unknown) =>
  ({
    content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }],
    finishReason: { unified: 'stop', raw: 'stop' },
    usage,
    warnings: [],
  } as never);
const action = (name: string, input: unknown) =>
  ({
    content: [
      { type: 'tool-call', toolCallId: `${name}-${Math.random()}`, toolName: name, input: JSON.stringify(input) },
    ],
    finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
    usage,
    warnings: [],
  } as never);
const confirm = () =>
  action('confirm', {
    accepted: true,
    verification: 'Checked the sum against the question and returned data.',
    summary: 'Total is 3.',
  });

function runtime(responses: never[]) {
  const model = new MockLanguageModelV3({ doGenerate: responses });
  const engine = {
    language: { name: 'DuckDB SQL', fence: 'sql' },
    execute: vi.fn().mockResolvedValue(result),
  } as unknown as AnalysisEngine;
  const onQueryUsage = vi.fn();
  const rt = apexRuntime(
    { context: { schema, profile: null }, llm: { model, maxRetries: 0, onQueryUsage }, engine, emit: vi.fn() },
    []
  );
  return { rt, model, engine, onQueryUsage };
}

describe('APEX schema linking and observations', () => {
  it('rescues positive selections and restores all composite join keys without mutating the input', () => {
    const before = JSON.stringify(schema);
    const noise = { table: 'orders', column: 'noise' };
    const amount = { table: 'orders', column: 'amount' };
    const pruned = prune(schema, [noise, amount], [amount]);
    expect(columns(pruned)).toContainEqual(amount);
    expect(columns(pruned)).not.toContainEqual(noise);
    const connected = connectSchema(schema, [amount, { table: 'customers', column: 'name' }]);
    expect(connected.relations).toEqual(schema.relations);
    expect(columns(connected)).toHaveLength(6);
    expect(JSON.stringify(schema)).toBe(before);
    expect(() => prune(schema, [{ table: 'unknown', column: 'id' }], [])).toThrow('unknown column');
  });

  it('restores intermediate bridge tables and keeps batches complete', () => {
    const full: Schema = {
      tables: ['a', 'bridge', 'b'].map((name) => ({
        name,
        fields: [{ name: 'id', type: 'INTEGER' }],
        indexes: [],
        columnCount: 1,
      })),
      relations: [
        { kind: 'foreign-key', from: { table: 'a', columns: ['id'] }, to: { table: 'bridge', columns: ['id'] } },
        { kind: 'foreign-key', from: { table: 'bridge', columns: ['id'] }, to: { table: 'b', columns: ['id'] } },
      ],
    };
    expect(
      connectSchema(full, [
        { table: 'a', column: 'id' },
        { table: 'b', column: 'id' },
      ]).tables.map(({ name }) => name)
    ).toEqual(['a', 'bridge', 'b']);
    expect(schemaBatches(schema, 60).flatMap(columns)).toEqual(columns(schema));
  });

  it('labels statistics from truncated observations and limits displayed samples', () => {
    const summary = observation({
      schema: [{ name: 'value' }],
      data: Array.from({ length: 40 }, (_, i) => ({ value: i % 2 ? null : i })),
      truncated: true,
      rowCount: 999,
    });
    expect(summary.rows).toHaveLength(10);
    expect(summary.rowCount).toBeUndefined();
    expect(summary.statisticsScope).toBe('returned rows only');
    expect(summary.statistics?.[0]).toMatchObject({ distinct: 20, nullRatio: 0.5 });
  });

  it('retrieves deterministic operation guidance', () => {
    const tips = retrieveGuidance('JOIN then RANK with division', 'rate is percent');
    expect(tips.some((tip) => tip.startsWith('join:'))).toBe(true);
    expect(tips.some((tip) => tip.startsWith('division:'))).toBe(true);
    expect(tips.some((tip) => tip.startsWith('ranking:'))).toBe(true);
    expect(tips.some((tip) => tip.startsWith('date:'))).toBe(false);
  });

  it('does not merge different multiplicities or ordered results during voting', () => {
    const a: ApexCandidate = { ...result, sql: 'select 3', confirmation: 'verified' };
    const b = { ...a, sql: 'select 1+2' };
    const duplicated = { ...a, data: [...a.data, ...a.data] };
    expect(votingLeaders([a, b, duplicated])).toEqual([0]);
    expect(resultKey(a)).not.toBe(resultKey(duplicated));
  });

  it('awaits in-flight workers before propagating failures', async () => {
    let finished = false;
    await expect(
      parallelMap([0, 1], 2, async (i) => {
        if (!i) throw new Error('failure');
        await new Promise((resolve) => setTimeout(resolve, 10));
        finished = true;
      })
    ).rejects.toThrow('failure');
    expect(finished).toBe(true);
  });

  it('serializes database execution across agents and recovers the queue after an error', async () => {
    const { rt, engine } = runtime([]);
    let active = 0;
    let peak = 0;
    vi.mocked(engine.execute).mockImplementation(async (sql) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      if (sql === 'bad') throw new Error('Invalid SQL');
      return result;
    });
    const outcomes = await Promise.allSettled([rt.execute('bad', {}, 'test'), rt.execute('good', {}, 'test')]);
    expect(outcomes.map(({ status }) => status)).toEqual(['rejected', 'fulfilled']);
    expect(peak).toBe(1);
  });
});

describe('APEX uses the real AI SDK ToolLoopAgent', () => {
  it('repairs malformed structured output once and counts usage for both calls', async () => {
    const { rt, onQueryUsage, model } = runtime([text({ wrong: true }), text({ reasoning: 'A valid plan' })]);
    expect(await rt.infer('plan', 'Plan a query', z.object({ reasoning: z.string() }))).toEqual({
      reasoning: 'A valid plan',
    });
    expect(onQueryUsage).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(model.doGenerateCalls[1].prompt)).toContain('failed JSON/schema validation');
  });

  it('requires SQL execution followed by confirmation and reports all model usage', async () => {
    const { rt, model, onQueryUsage } = runtime([
      action('sql', { sql: 'SELECT SUM(amount) AS total FROM orders' }),
      confirm(),
    ]);
    const answer = await generateCandidate('Sum amounts', { includeSummary: false }, { type: 'apex', maxSteps: 2 }, rt);
    expect(answer.data).toEqual(result.data);
    expect(answer.confirmation).toContain('Checked');
    expect(model.doGenerateCalls.map(({ toolChoice }) => toolChoice)).toEqual([
      { type: 'tool', toolName: 'sql' },
      { type: 'tool', toolName: 'confirm' },
    ]);
    expect(onQueryUsage).toHaveBeenCalledTimes(2);
  });

  it('feeds execution errors back to the model for correction', async () => {
    const { rt, engine, model } = runtime([
      action('sql', { sql: 'bad' }),
      action('sql', { sql: 'SELECT 3 AS total' }),
      confirm(),
    ]);
    vi.mocked(engine.execute).mockRejectedValueOnce(new Error('Missing column'));
    const answer = await generateCandidate('Total', {}, { type: 'apex', maxSteps: 4 }, rt);
    expect(answer.sql).toBe('SELECT 3 AS total');
    expect(JSON.stringify(model.doGenerateCalls[1].prompt)).toContain('Missing column');
  });

  it('rejects unconfirmed, truncated and over-budget outputs', async () => {
    const plain = runtime([text('Done')]);
    await expect(generateCandidate('Total', {}, { type: 'apex' }, plain.rt)).rejects.toThrow(
      'tool choice was required'
    );
    const truncated = runtime([action('sql', { sql: 'select 3' }), action('sql', { sql: 'select 3' })]);
    vi.mocked(truncated.engine.execute).mockResolvedValue({ ...result, truncated: true });
    await expect(generateCandidate('Total', {}, { type: 'apex', maxSteps: 2 }, truncated.rt)).rejects.toThrow(
      'without a confirmed'
    );
    const budget = runtime([]);
    await expect(
      generateCandidate('x'.repeat(10000), {}, { type: 'apex', maxContextTokens: 1024 }, budget.rt)
    ).rejects.toThrow('context budget');
    expect(budget.model.doGenerateCalls).toHaveLength(0);
  });

  it('does not accept a confirmation in the same turn as its SQL', async () => {
    const sql = action('sql', { sql: 'SELECT 3 AS total' }) as { content: unknown[] };
    const confirmation = confirm() as { content: unknown[] };
    const { rt, model } = runtime([{ ...sql, content: [...sql.content, ...confirmation.content] } as never, confirm()]);
    const answer = await generateCandidate('Total', {}, { type: 'apex', maxSteps: 3 }, rt);
    expect(answer.data).toEqual(result.data);
    expect(model.doGenerateCalls).toHaveLength(2);
    expect(JSON.stringify(model.doGenerateCalls[1].prompt)).toContain("unavailable tool 'confirm'");
  });

  it('consolidates history while preserving actual evidence', async () => {
    const { rt, model } = runtime([
      action('explore', { hypothesis: 'Verify amount values', sql: 'SELECT amount FROM orders' }),
      action('consolidate', { findings: 'Observed values', plan: 'Sum amount', uncertainties: '' }),
      action('sql', { sql: 'SELECT SUM(amount) AS total FROM orders' }),
      confirm(),
    ]);
    await generateCandidate('Total', {}, { type: 'apex', maxSteps: 6 }, rt);
    const context = JSON.stringify(model.doGenerateCalls[2].prompt);
    expect(context).toContain('Recorded query observations');
    expect(context).toContain('SELECT amount FROM orders');
    expect(context).toContain('Latest consolidated state');
  });

  it('allows semantic rejection even when the budget forces a confirmation', async () => {
    const { rt } = runtime([
      action('sql', { sql: 'SELECT 3 AS total' }),
      action('confirm', { accepted: false, verification: 'The requested filter is missing.', summary: '' }),
    ]);
    await expect(generateCandidate('Filtered total', {}, { type: 'apex', maxSteps: 2 }, rt)).rejects.toThrow(
      'without a confirmed'
    );
  });

  it('keeps a failed trajectory separate from the next candidate and supports the no-exploration ablation', async () => {
    const refs = columns(schema);
    const { rt, engine, model } = runtime([
      text({ reasoning: 'Plan A' }),
      text({ reasoning: 'Plan B' }),
      text({ reasoning: 'Master plan' }),
      text({ columns: [] }),
      text({ columns: refs }),
      text({ reasoning: 'Column roles' }),
      text({ columns: refs }),
      text({ operations: 'SUM' }),
      text('Invalid tool-free response'),
      action('sql', { sql: 'SELECT 3 AS total' }),
      confirm(),
    ]);
    const answer = await apexAnalysis(
      'Total',
      { strategy: { type: 'apex', ablation: 'no-exploration', samples: 2, maxSteps: 2 } },
      rt
    );
    expect(answer.apex?.candidates[0].error).toContain('required tool');
    expect(answer.apex?.selected).toBe(1);
    expect(engine.execute).toHaveBeenCalledOnce();
    expect(model.doGenerateCalls).toHaveLength(11);
  });

  it('runs the complete pipeline on a real DuckDB engine without leaking schema into planning', async () => {
    const llm = { model: new MockLanguageModelV3(), maxRetries: 0 };
    const engine = new DuckDBEngine(llm);
    try {
      await engine.load({ type: 'json', options: { data: [{ amount: 1 }, { amount: 2 }] } });
      const actual = await engine.schema();
      const table = actual.tables[0].name;
      const refs = columns(actual);
      const responses = [
        text({ reasoning: 'Sum the amounts.' }),
        text({ reasoning: 'Aggregate all amounts.' }),
        text({ reasoning: 'Sum amounts.' }),
        text({ columns: [] }),
        text({ columns: refs }),
        text({ reasoning: 'Amount is the measure to sum.' }),
        action('explore', { hypothesis: 'Check numeric amounts', sql: `SELECT amount FROM "${table}"` }),
        action('report', { reasoning: 'Amounts 1 and 2 observed.' }),
        text({ columns: refs }),
        text({ operations: 'SUM aggregate' }),
        action('sql', { sql: `SELECT SUM(amount) AS total FROM "${table}"` }),
        confirm(),
      ];
      llm.model = new MockLanguageModelV3({ doGenerate: responses });
      const answer = await apexAnalysis(
        'What is the total?',
        {
          strategy: { type: 'apex', evidence: 'PRIVATE_REFERENCE', schemaDescriptions: 'PRIVATE_DESCRIPTION' },
          includeSummary: false,
        },
        { context: { schema: actual, profile: null }, engine, llm, emit: vi.fn() }
      );
      expect(Number(answer.data[0].total)).toBe(3);
      expect(answer.text).toBe('');
      expect(answer.apex?.schema).toEqual(actual);
      for (const call of llm.model.doGenerateCalls.slice(0, 3)) {
        expect(JSON.stringify(call.prompt)).not.toContain('PRIVATE_REFERENCE');
        expect(JSON.stringify(call.prompt)).not.toContain('PRIVATE_DESCRIPTION');
        expect(JSON.stringify(call.prompt)).not.toContain(`Table \\"${table}`);
      }
      expect(answer.apex?.events.some(({ stage }) => stage === 'confirmation')).toBe(true);
    } finally {
      await engine.dispose();
    }
  });
});
