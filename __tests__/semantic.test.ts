import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';
import { MockLanguageModelV3 } from 'ai/test';

import { AVA } from '../src';
import { analyze } from '../src/analysis';
import { SemanticRegistry } from '../src/semantic/registry';
import { compileSMQ } from '../src/semantic/compiler';

import type { AnalysisEngine, AnalysisStrategyConfig, SemanticConfig, SMQ } from '../src';

vi.mock('ai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ai')>()),
  generateText: vi.fn(),
}));

type ModelResponse = ReturnType<MockLanguageModelV3['doGenerate']> extends PromiseLike<infer T> ? T : never;
let callId = 0;
const call = (toolName: string, args: object): ModelResponse => ({
  content: [{ type: 'tool-call', toolCallId: String(callId++), toolName, input: JSON.stringify(args) }],
  finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
  usage: {
    inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
    outputTokens: { total: 5, text: 5, reasoning: 0 },
  },
  warnings: [],
});

const config: SemanticConfig = {
  models: [
    {
      name: 'orders',
      table: 'orders',
      dimensions: [
        { name: 'status', column: 'status' },
        { name: 'channel', column: 'channel' },
        { name: 'year', expr: 'EXTRACT(YEAR FROM {TABLE}.created_at)' },
      ],
      measures: [{ name: 'amount', column: 'amount', type: 'number' }],
      metrics: [
        { name: 'revenue', agg: 'sum', column: 'amount' },
        { name: 'count', agg: 'count' },
        { name: 'buyers', agg: 'count_distinct', column: 'customer_id' },
      ],
    },
    {
      name: 'customers',
      table: 'main.customers',
      dimensions: [{ name: 'region', column: 'region' }],
      metrics: [{ name: 'signups', agg: 'count' }],
    },
    { name: 'regions', table: 'regions', dimensions: [{ name: 'manager', column: 'manager' }] },
  ],
  joins: [
    { from: 'orders', to: 'customers', keys: [{ from: 'customer_id', to: 'id' }] },
    { from: 'customers', to: 'regions', keys: [{ from: 'region', to: 'name' }], type: 'inner' },
  ],
};

const registry = () => new SemanticRegistry(config);

describe('SMQ compiler', () => {
  it('compiles a single-model query', () => {
    const { sql, columns, tables } = compileSMQ(registry(), {
      metrics: ['orders__revenue'],
      filters: ["orders__status = 'paid'"],
      group_by: ['orders__channel'],
    });

    expect(sql).toBe(
      [
        'SELECT "orders"."channel" AS "orders__channel", SUM("orders"."amount") AS "orders__revenue"',
        'FROM "orders" AS "orders"',
        'WHERE "orders"."status" = \'paid\'',
        'GROUP BY "orders"."channel"',
      ].join('\n')
    );
    expect(columns).toEqual(['orders__channel', 'orders__revenue']);
    expect(tables).toEqual(['orders']);
  });

  it('is deterministic', () => {
    const smq = { metrics: ['orders__count', 'orders__buyers'], group_by: ['orders__year'], limit: 3 };
    expect(compileSMQ(registry(), smq)).toEqual(compileSMQ(registry(), smq));
  });

  it('joins models along the shortest path with oriented keys', () => {
    const { sql, models } = compileSMQ(registry(), {
      metrics: ['orders__revenue'],
      group_by: ['regions__manager'],
    });

    expect(models).toEqual(['orders', 'customers', 'regions']);
    expect(sql).toContain('LEFT JOIN "main"."customers" AS "customers" ON "orders"."customer_id" = "customers"."id"');
    expect(sql).toContain('INNER JOIN "regions" AS "regions" ON "customers"."region" = "regions"."name"');
  });

  it('joins in reverse direction of the declared edge', () => {
    const { sql } = compileSMQ(registry(), { metrics: ['customers__signups'], group_by: ['orders__channel'] });
    expect(sql).toContain('FROM "main"."customers" AS "customers"');
    expect(sql).toContain('"customers"."id" = "orders"."customer_id"');
  });

  it('routes metric filters to HAVING and dimension filters to WHERE', () => {
    const { sql } = compileSMQ(registry(), {
      metrics: ['orders__revenue'],
      group_by: ['orders__channel'],
      filters: ['orders__revenue > 100', "orders__channel IN ('a', 'b') AND NOT orders__status IS NULL"],
      order_by: [{ field: 'orders__revenue', direction: 'desc' }],
      limit: 5,
    });
    expect(sql).toContain('WHERE ("orders"."channel" IN (\'a\', \'b\') AND NOT "orders"."status" IS NULL)');
    expect(sql).toContain('HAVING SUM("orders"."amount") > 100');
    expect(sql).toContain('ORDER BY "orders__revenue" DESC\nLIMIT 5');
  });

  it('escapes string literals and supports other dialects', () => {
    const smq = { metrics: ['orders__count'], filters: ["orders__status = 'it''s'"] };
    expect(compileSMQ(registry(), smq).sql).toContain("= 'it''s'");
    expect(compileSMQ(registry(), smq, 'mysql').sql).toContain('`orders`.`status`');
  });

  it('selects DISTINCT dimensions when no metrics are requested', () => {
    expect(compileSMQ(registry(), { group_by: ['orders__channel'] }).sql).toMatch(/^SELECT DISTINCT/);
  });

  it('filters row measures before aggregation, including mixed dimension/measure predicates', () => {
    const { sql } = compileSMQ(registry(), {
      metrics: ['orders__revenue'],
      group_by: ['orders__channel'],
      filters: ["orders__status = 'paid' AND orders__amount > 10", 'orders__revenue > 100'],
    });
    expect(sql).toContain('WHERE ("orders"."status" = \'paid\' AND "orders"."amount" > 10)');
    expect(sql).toContain('HAVING SUM("orders"."amount") > 100');
    expect(compileSMQ(registry(), { group_by: ['orders__amount'] }).sql).toContain(
      'SELECT DISTINCT "orders"."amount" AS "orders__amount"'
    );
  });

  it.each([
    [{}, 'at least one'],
    [{ metrics: ['orders__nope'] }, 'Unknown element'],
    [{ metrics: ['nope__x'] }, 'Unknown semantic model'],
    [{ metrics: ['orders'] }, 'Invalid element reference'],
    [{ metrics: ['orders__count'], group_by: ['orders__revenue'] }, 'requires a dimension'],
    [{ metrics: ['orders__count'], filters: ["orders__status = 'a'; DROP TABLE orders"] }, 'Unsupported character'],
    [{ metrics: ['orders__count'], filters: ['orders__status = (SELECT 1)'] }, 'Invalid filter'],
    [{ metrics: ['orders__count'], filters: ["status = 'a'"] }, 'Invalid element reference'],
    [{ metrics: ['orders__count'], filters: ["orders__status = 'a' OR orders__revenue > 1"] }, 'mixes'],
    [{ metrics: ['orders__count'], filters: ["orders__status = 'unterminated"] }, 'Unterminated'],
    [{ metrics: ['orders__count'], order_by: [{ field: 'orders__status' }] }, 'must be one of'],
    [{ metrics: ['orders__count'], limit: -1 }, 'too_small'],
  ])('rejects invalid SMQ %j', (smq, message) => {
    expect(() => compileSMQ(registry(), smq as never)).toThrow(message);
  });

  it('rejects disconnected models', () => {
    const disconnected = new SemanticRegistry({
      models: [
        { name: 'a', table: 'a', metrics: [{ name: 'n', agg: 'count' }] },
        { name: 'b', table: 'b', dimensions: [{ name: 'x', column: 'x' }] },
      ],
    });
    expect(() => compileSMQ(disconnected, { metrics: ['a__n'], group_by: ['b__x'] })).toThrow('No join path');
  });
});

describe('SemanticRegistry', () => {
  it('rejects invalid definitions', () => {
    expect(() => new SemanticRegistry({ models: [] })).toThrow();
    expect(() => new SemanticRegistry({ models: [{ name: 'a__b', table: 'a' }] })).toThrow();
    expect(() => new SemanticRegistry({ models: [{ name: 'a', table: 'a; DROP' }] })).toThrow();
    expect(
      () => new SemanticRegistry({ models: [{ name: 'a', table: 'a', dimensions: [{ name: 'x', expr: '1; --' }] }] })
    ).toThrow();
    expect(
      () =>
        new SemanticRegistry({
          models: [{ name: 'a', table: 'a' }],
          joins: [{ from: 'a', to: 'z', keys: [{ from: 'x', to: 'y' }] }],
        })
    ).toThrow('unknown model');
  });

  it('validates tables against the engine schema', () => {
    const schema = { tables: [{ name: 'orders' }, { name: 'customers' }, { name: 'regions' }] } as never;
    expect(() => registry().validateAgainstSchema(schema)).not.toThrow();
    expect(() => registry().validateAgainstSchema({ tables: [{ name: 'orders' }] } as never)).toThrow('unknown table');
  });

  it('accepts a JSON string', () => {
    expect(new SemanticRegistry(JSON.stringify(config)).models.size).toBe(3);
  });

  it('accepts YAML and exposes all three element kinds', () => {
    const yaml = `
dialect: duckdb
models:
  - name: orders
    table: orders
    dimensions:
      - { name: channel, expr: '{TABLE}."channel"' }
    measures:
      - { name: amount, column: amount, description: '实际支付金额', type: number }
    metrics:
      - { name: revenue, agg: sum, column: amount }
      - { name: average, expr: 'SUM({TABLE}."amount") / NULLIF(COUNT(*), 0)' }
`;
    const semantic = new SemanticRegistry(yaml);
    expect(semantic.elements().map((e) => e.kind)).toEqual(['dimension', 'measure', 'metric', 'metric']);
    expect(semantic.resolve('orders__amount').measure?.description).toBe('实际支付金额');
    expect(compileSMQ(semantic, { metrics: ['orders__average'] }).sql).toContain(
      'SUM("orders"."amount") / NULLIF(COUNT(*), 0)'
    );
    expect(compileSMQ(semantic, { metrics: ['orders__revenue'], group_by: ['orders__channel'] }).sql).toBe(
      compileSMQ(registry(), { metrics: ['orders__revenue'], group_by: ['orders__channel'] }).sql
    );
  });

  it('rejects malformed YAML, duplicate keys, cross-kind names and legacy aggregate measures', () => {
    expect(() => new SemanticRegistry('models: [')).toThrow();
    expect(() => new SemanticRegistry('models: []\nmodels: []')).toThrow();
    expect(
      () =>
        new SemanticRegistry({
          models: [
            {
              name: 'orders',
              table: 'orders',
              measures: [{ name: 'amount', column: 'amount' }],
              metrics: [{ name: 'amount', agg: 'sum', column: 'amount' }],
            },
          ],
        })
    ).toThrow('Duplicate element');
    expect(
      () =>
        new SemanticRegistry(
          JSON.stringify({
            models: [
              {
                name: 'orders',
                table: 'orders',
                measures: [{ name: 'revenue', agg: 'sum', column: 'amount' }],
              },
            ],
          })
        )
    ).toThrow();
  });
});

describe('semantic strategy', () => {
  beforeEach(() => vi.clearAllMocks());

  function setup(responses: ModelResponse[], settings = {}) {
    const model = new MockLanguageModelV3({ doGenerate: responses });

    const engine = {
      language: { name: 'DuckDB SQL', fence: 'sql' },
      validateSemanticQuery: vi.fn(async (sql: string) => {
        if (sql.includes('secrets')) throw new Error('Table not introduced: secrets');
      }),
      execute: vi.fn().mockImplementation(async (sql: string) => ({
        schema: [{ name: 'v' }],
        data: [{ v: sql.length }],
        rowCount: 1,
      })),
    } as unknown as AnalysisEngine;
    const emit = vi.fn();
    const run = (
      strategy: Extract<AnalysisStrategyConfig, { type: 'semantic' }> = { type: 'semantic' },
      includeSummary = false
    ) =>
      analyze(
        'revenue per channel',
        { strategy, includeSummary },
        {
          emit,
          context: {
            schema: { tables: [{ name: 'orders' }, { name: 'customers' }, { name: 'regions' }] } as never,
            profile: null,
          },
          engine,
          llm: { model, ...settings },
          semantic: registry(),
        }
      );
    return { engine, emit, run, model };
  }

  it('runs discover → explore → compose → execute', async () => {
    const { engine, run, model } = setup([
      call('getModelDataElements', {}),
      call('convertSmqToSql', { metrics: ['orders__revenue'], group_by: ['orders__channel'] }),
      call('execute', { sql: 'WITH r AS (SELECT 1 FROM "orders") SELECT * FROM r' }),
    ]);

    const result = await run();

    expect(model.doGenerateCalls).toHaveLength(3);
    expect(model.doGenerateCalls[0].tools?.map((entry) => entry.name).sort()).toEqual([
      'cannotAnswer',
      'convertSmqToSql',
      'execute',
      'getModelDataElements',
    ]);
    expect(model.doGenerateCalls[0].tools?.find((entry) => entry.name === 'execute')).toMatchObject({
      inputSchema: { type: 'object', required: ['sql'], additionalProperties: false },
    });
    expect(model.doGenerateCalls[0].prompt.map((message) => message.role)).toEqual(['system', 'user']);
    expect(model.doGenerateCalls[1].prompt.map((message) => message.role)).toEqual([
      'system',
      'user',
      'assistant',
      'tool',
    ]);
    expect(JSON.stringify(model.doGenerateCalls[1].prompt)).toContain('revenue');
    expect(JSON.stringify(model.doGenerateCalls[2].prompt)).toContain('"preview"');
    expect(engine.execute).toHaveBeenCalledTimes(2);
    expect(vi.mocked(engine.execute).mock.calls[0][1]).toMatchObject({ maxRows: 5 });
    expect(result.sql).toBe('WITH r AS (SELECT 1 FROM "orders") SELECT * FROM r');
    expect(result.data).toHaveLength(1);
  });

  it('rejects execute before any SMQ compiled and on foreign tables, without executing', async () => {
    const { engine, run, model } = setup([
      call('execute', { sql: 'SELECT 1 FROM orders' }),
      call('getModelDataElements', {}),
      call('convertSmqToSql', { metrics: ['orders__count'] }),
      call('execute', { sql: 'SELECT * FROM secrets' }),
      call('execute', { sql: 'SELECT * FROM orders' }),
    ]);

    await run();

    expect(model.doGenerateCalls).toHaveLength(5);
    expect(JSON.stringify(model.doGenerateCalls[1].prompt)).toContain('at least once');
    expect(JSON.stringify(model.doGenerateCalls[4].prompt)).toContain('secrets');
    expect(engine.execute).toHaveBeenCalledTimes(2); // preview + final
  });

  it('feeds compile and protocol errors back to the model', async () => {
    const { run, model } = setup([
      {
        ...call('getModelDataElements', {}),
        content: [{ type: 'tool-call', toolCallId: 'invalid', toolName: 'getModelDataElements', input: '{' }],
      },
      call('getModelDataElements', {}),
      call('convertSmqToSql', { metrics: ['orders__bogus'] }),
      call('convertSmqToSql', { metrics: ['orders__count'] }),
      call('execute', { sql: 'SELECT 1 FROM orders' }),
    ]);

    await run();

    expect(JSON.stringify(model.doGenerateCalls[1].prompt)).toContain('error');
    expect(JSON.stringify(model.doGenerateCalls[3].prompt)).toContain('Unknown element');
  });

  it('forwards model settings without imposing a benchmark answer shape', async () => {
    const settings = {
      temperature: 0.1,
      maxOutputTokens: 16384,
      providerOptions: { google: { thinkingConfig: { thinkingLevel: 'high' } } },
    };
    const { run, model } = setup(
      [
        call('getModelDataElements', {}),
        call('convertSmqToSql', { metrics: ['revenue'] }),
        call('execute', { sql: 'SELECT SUM(amount) FROM orders' }),
      ],
      settings
    );
    await run();
    expect(model.doGenerateCalls[0]).toMatchObject(settings);
    expect(JSON.stringify(model.doGenerateCalls[0].prompt)).not.toContain('one scalar column named answer');
  });

  it('requires discovery and does not accept a failed preview as evidence', async () => {
    const { engine, run, model } = setup([
      call('convertSmqToSql', { metrics: ['revenue'] }),
      call('getModelDataElements', {}),
      call('convertSmqToSql', { metrics: ['revenue'] }),
      call('execute', { sql: 'SELECT SUM(amount) FROM orders' }),
      call('convertSmqToSql', { metrics: ['revenue'] }),
      call('execute', { sql: 'SELECT SUM(amount) FROM orders' }),
    ]);
    vi.mocked(engine.execute).mockRejectedValueOnce(new Error('preview failed'));
    await run();
    expect(JSON.stringify(model.doGenerateCalls[1].prompt)).toContain('Discover');
    expect(JSON.stringify(model.doGenerateCalls[4].prompt)).toContain('at least once');
    expect(engine.execute).toHaveBeenCalledTimes(3);
  });

  it('rejects multi-action payloads before running any tool', async () => {
    const response = call('getModelDataElements', {});
    response.content.push(...call('convertSmqToSql', { metrics: ['revenue'] }).content);
    const { run, engine, model } = setup([response, call('execute', { sql: 'SELECT 1 FROM orders' })]);
    await expect(run({ type: 'semantic', maxSteps: 2 })).rejects.toThrow('step limit');
    expect(engine.execute).not.toHaveBeenCalled();
    expect(JSON.stringify(model.doGenerateCalls[1].prompt)).toContain('Call exactly one tool per step');
  });

  it.each(['conversion failed', 'query timeout', 'permission denied'])(
    'terminates on execution error: %s',
    async (message) => {
      const { engine, run, model } = setup([
        call('getModelDataElements', {}),
        call('convertSmqToSql', { metrics: ['orders__count'] }),
        call('execute', { sql: 'SELECT 1 FROM orders' }),
      ]);
      vi.mocked(engine.execute)
        .mockResolvedValueOnce({ schema: [], data: [] })
        .mockRejectedValueOnce(new Error(message));
      await expect(run()).rejects.toThrow(message);
      expect(engine.execute).toHaveBeenCalledTimes(2);
      expect(model.doGenerateCalls).toHaveLength(3);
    }
  );

  it.each([
    { schema: [{ name: 'channel' }, { name: 'revenue' }], data: [{ channel: 'web', revenue: 5 }] },
    { schema: [{ name: 'value' }], data: [{ value: null }] },
    { schema: [{ name: 'values' }], data: [{ values: [true, false] }] },
    { schema: [{ name: 'value' }], data: [] },
    { schema: [{ name: 'value' }], data: [{ value: 1 }, { value: 2 }] },
    { schema: [{ name: 'value' }], data: [{ value: 1 }], truncated: true as const, truncatedBy: 'maxRows' as const },
    { schema: [{ name: 'value' }], data: [], truncated: true as const, truncatedBy: 'maxResultBytes' as const },
  ])('preserves general results and completeness metadata without rewriting SQL: %j', async (output) => {
    const { engine, run, model } = setup([
      call('getModelDataElements', {}),
      call('convertSmqToSql', { metrics: ['orders__amount'] }),
      call('execute', { sql: 'SELECT amount FROM orders' }),
    ]);
    vi.mocked(engine.execute).mockResolvedValueOnce({ schema: [], data: [] }).mockResolvedValueOnce(output);
    const result = await run();
    expect(result).toMatchObject(output);
    expect(result.sql).toBe('SELECT amount FROM orders');
    expect(engine.execute).toHaveBeenCalledTimes(2);
    expect(model.doGenerateCalls).toHaveLength(3);
  });

  it('can end with missing information on the final step without querying or summarizing', async () => {
    const { engine, run, model } = setup([
      call('getModelDataElements', {}),
      call('cannotAnswer', { reason: 'The required customer relationship is not defined.' }),
    ]);
    await expect(run({ type: 'semantic', maxSteps: 2 }, true)).rejects.toMatchObject({
      name: 'InsufficientInformationError',
      message: 'The required customer relationship is not defined.',
    });
    expect(engine.execute).not.toHaveBeenCalled();
    expect(generateText).not.toHaveBeenCalled();
    expect(model.doGenerateCalls).toHaveLength(2);
    expect(model.doGenerateCalls[1].tools?.map((tool) => tool.name).sort()).toEqual(['cannotAnswer', 'execute']);
  });

  it('requires discovery and a nonempty reason before accepting cannotAnswer', async () => {
    const { engine, run, model } = setup([
      call('cannotAnswer', { reason: 'No mapping' }),
      call('getModelDataElements', {}),
      call('cannotAnswer', { reason: ' ' }),
      call('cannotAnswer', { reason: 'No mapping for the requested business term.' }),
    ]);
    await expect(run()).rejects.toMatchObject({ name: 'InsufficientInformationError' });
    expect(model.doGenerateCalls).toHaveLength(4);
    expect(engine.execute).not.toHaveBeenCalled();
  });

  it('rejects parallel execute and cannotAnswer without terminating or executing either', async () => {
    const response = call('cannotAnswer', { reason: 'Missing mapping' });
    response.content.push(...call('execute', { sql: 'SELECT amount FROM orders' }).content);
    const { engine, run, model } = setup([
      call('getModelDataElements', {}),
      response,
      call('cannotAnswer', { reason: 'Missing mapping' }),
    ]);
    await expect(run()).rejects.toMatchObject({ name: 'InsufficientInformationError' });
    expect(engine.execute).not.toHaveBeenCalled();
    expect(JSON.stringify(model.doGenerateCalls[2].prompt)).toContain('Call exactly one tool per step');
  });

  it('exposes preview truncation and the actual DISTINCT grain', async () => {
    const { engine, run, model } = setup([
      call('getModelDataElements', {}),
      call('convertSmqToSql', { group_by: ['orders__channel'] }),
      call('execute', { sql: 'SELECT DISTINCT channel FROM orders' }),
    ]);
    vi.mocked(engine.execute).mockResolvedValueOnce({
      schema: [{ name: 'orders__channel' }],
      data: [{ orders__channel: 'web' }],
      truncated: true,
      truncatedBy: 'maxResultBytes',
    });
    await run();
    const output = JSON.stringify(model.doGenerateCalls[2].prompt);
    expect(output).toContain('"grain":"distinct"');
    expect(output).toContain('"fragmentId":"smq_1"');
    expect(output).toContain('"returnedRows":1');
    expect(output).toContain('"truncated":true');
  });
  it('rejects parallel final calls and then executes only once', async () => {
    const response = call('execute', { sql: 'SELECT SUM(amount) FROM orders' });
    response.content.push(...call('execute', { sql: 'SELECT SUM(amount) FROM orders' }).content);
    const { engine, run, model } = setup([
      call('getModelDataElements', {}),
      call('convertSmqToSql', { metrics: ['revenue'] }),
      response,
      call('execute', { sql: 'SELECT SUM(amount) FROM orders' }),
    ]);
    await run({ type: 'semantic', maxSteps: 4 });
    expect(engine.execute).toHaveBeenCalledTimes(2);
    expect(engine.validateSemanticQuery).toHaveBeenCalledTimes(1);
    expect(model.doGenerateCalls).toHaveLength(4);
  });

  it('feeds schema errors back without executing an invalid tool', async () => {
    const { engine, run, model } = setup([
      call('getModelDataElements', {}),
      call('convertSmqToSql', { metrics: ['revenue'], limit: 0 }),
      call('convertSmqToSql', { metrics: ['revenue'] }),
      call('execute', { sql: 'SELECT SUM(amount) FROM orders' }),
    ]);
    await run();
    expect(engine.execute).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(model.doGenerateCalls[2].prompt)).toContain('error');
  });

  it('reports per-step usage and keeps reasoning events before query events', async () => {
    const onQueryUsage = vi.fn();
    const { run, emit } = setup(
      [
        call('getModelDataElements', {}),
        call('convertSmqToSql', { metrics: ['revenue'] }),
        call('execute', { sql: 'SELECT SUM(amount) FROM orders' }),
      ],
      { onQueryUsage }
    );
    await run();
    expect(onQueryUsage).toHaveBeenCalledTimes(3);
    expect(onQueryUsage).toHaveBeenCalledWith(expect.objectContaining({ inputTokens: 10, outputTokens: 5 }));
    expect(emit.mock.calls.map(([event]) => event.type)).toEqual([
      'reasonstart',
      'reasonend',
      'reasonstart',
      'reasonend',
      'querystart',
      'queryend',
      'reasonstart',
      'reasonend',
      'querystart',
      'queryend',
    ]);
    expect(emit.mock.calls.filter(([event]) => event.type === 'reasonend').map(([event]) => event.data.action)).toEqual(
      ['getModelDataElements', 'convertSmqToSql', 'execute']
    );
  });

  it('closes reasoning events when the model call fails', async () => {
    const model = new MockLanguageModelV3({
      doGenerate: async () => {
        throw new Error('model unavailable');
      },
    });
    const { run, emit, engine } = setup([], { model, maxRetries: 0 });
    await expect(run()).rejects.toThrow('model unavailable');
    expect(emit.mock.calls.map(([event]) => event.type)).toEqual(['reasonstart', 'reasonend']);
    expect(engine.execute).not.toHaveBeenCalled();
  });

  it('summarizes the executed result after the agent stops', async () => {
    const { run, model } = setup([
      call('getModelDataElements', {}),
      call('convertSmqToSql', { metrics: ['revenue'] }),
      call('execute', { sql: 'SELECT SUM(amount) FROM orders' }),
    ]);
    vi.mocked(generateText).mockResolvedValueOnce({ text: 'Revenue summary' } as never);
    const result = await run({ type: 'semantic' }, true);
    expect(result.text).toBe('Revenue summary');
    expect(model.doGenerateCalls).toHaveLength(3);
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it('enforces the step limit', async () => {
    const { run, model } = setup([call('getModelDataElements', {}), call('execute', { sql: 'SELECT 1 FROM orders' })]);

    await expect(run({ type: 'semantic', maxSteps: 2 })).rejects.toThrow('step limit');
    expect(model.doGenerateCalls).toHaveLength(2);
    expect(model.doGenerateCalls[1].toolChoice).toEqual({ type: 'required' });
    expect(model.doGenerateCalls[1].tools?.map((tool) => tool.name).sort()).toEqual(['cannotAnswer', 'execute']);
  });

  it('discovers join-only models even when they expose no elements', async () => {
    const semantic = new SemanticRegistry({
      models: [
        { name: 'a', table: 'a', metrics: [{ name: 'n', agg: 'count' }] },
        { name: 'bridge', table: 'bridge' },
        { name: 'b', table: 'b', dimensions: [{ name: 'label', column: 'label' }] },
      ],
      joins: [
        { from: 'a', to: 'bridge', keys: [{ from: 'id', to: 'a_id' }] },
        { from: 'bridge', to: 'b', keys: [{ from: 'b_id', to: 'id' }] },
      ],
    });
    const { engine, model } = setup([
      call('getModelDataElements', {}),
      call('convertSmqToSql', { metrics: ['n'], group_by: ['b__label'] }),
      call('execute', { sql: 'SELECT 1 FROM a' }),
    ]);
    await analyze(
      'count by label',
      { strategy: { type: 'semantic' }, includeSummary: false },
      {
        context: { schema: { tables: ['a', 'bridge', 'b'].map((name) => ({ name })) } as never },
        engine,
        semantic,
        emit: vi.fn(),
        llm: { model },
      }
    );
    expect(model.doGenerateCalls).toHaveLength(3);
    expect(engine.execute).toHaveBeenCalledTimes(2);
  });

  it('requires a registered semantic layer', async () => {
    await expect(
      analyze(
        'q',
        { strategy: { type: 'semantic' } },
        {
          emit: vi.fn(),
          context: { schema: { tables: [] } as never, profile: null },
          engine: {} as AnalysisEngine,
          llm: { model: 'test' },
        }
      )
    ).rejects.toThrow('semantic()');
  });
});

describe('AVA semantic API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('compiles SMQ without an engine, LLM or database', () => {
    const ava = new AVA({ llm: { model: 'test', apiKey: 'test' } });
    expect(() => ava.compileSMQ({ metrics: ['orders__count'] })).toThrow('semantic()');

    const { sql } = ava.semantic(config).compileSMQ({ metrics: ['orders__count'] });
    expect(sql).toContain('COUNT(*)');
    expect(generateText).not.toHaveBeenCalled();
  });

  it('executes YAML row-measure filters and aggregate metrics on DuckDB', async () => {
    const ava = new AVA({ llm: { model: 'test', apiKey: 'test' } });
    await ava.source({
      type: 'json',
      options: {
        data: [
          { status: 'paid', channel: 'web', amount: 10 },
          { status: 'paid', channel: 'web', amount: 5 },
          { status: 'paid', channel: 'web', amount: 0 },
          { status: 'paid', channel: 'app', amount: 7 },
          { status: 'refunded', channel: 'app', amount: 99 },
        ],
      },
    });
    const table = (await ava.schema()).tables[0].name;
    ava.semantic(`
models:
  - name: orders
    table: ${table}
    dimensions:
      - { name: status, column: status }
      - { name: channel, column: channel }
    measures:
      - { name: amount, expr: '{TABLE}."amount"' }
    metrics:
      - { name: revenue, agg: sum, column: amount }
      - { name: average, expr: 'SUM({TABLE}."amount") / NULLIF(COUNT(*), 0)' }
`);

    const { sql } = ava.compileSMQ({
      metrics: ['orders__revenue', 'orders__average'],
      filters: ["orders__status = 'paid' AND orders__amount > 0"],
      group_by: ['orders__channel'],
      order_by: [{ field: 'orders__channel' }],
    });
    const result = await ava.query(sql);
    expect(result.data).toEqual([
      { orders__channel: 'app', orders__revenue: 7, orders__average: 7 },
      { orders__channel: 'web', orders__revenue: 15, orders__average: 7.5 },
    ]);
    await ava.dispose();
  });
});

describe('semantic answer composition', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns a bounded sample of a 1000-row query without turning it into a top-200 query', async () => {
    const responses = [call('getModelDataElements', {}), call('convertSmqToSql', { metrics: ['records__value'] })];
    let finalSql = '';
    const model = new MockLanguageModelV3({
      doGenerate: async (options) => {
        if (responses.length) return responses.shift()!;
        const message = options.prompt[options.prompt.length - 1];
        if (message.role !== 'tool') throw new Error('Expected compiler result');
        const output = message.content[0];
        if (output.type !== 'tool-result' || output.output.type !== 'json') throw new Error('Expected JSON result');
        const compiled = output.output.value as { sql: string; truncated: boolean };
        expect(compiled.truncated).toBe(true);
        finalSql = compiled.sql;
        return call('execute', { sql: finalSql });
      },
    });
    const ava = new AVA({ llm: { model } });
    try {
      await ava.source({
        type: 'json',
        options: { data: Array.from({ length: 1000 }, (_, i) => ({ value: i % 10 ? i % 3 : null })) },
      });
      ava.semantic({
        models: [{ name: 'records', table: 'data', dimensions: [{ name: 'value', column: 'value' }] }],
      });
      const result = await ava.analyze('Return every recorded value, including duplicates and missing values.', {
        strategy: { type: 'semantic' },
        includeSummary: false,
      });
      expect(result.sql).toBe(finalSql);
      expect(result.sql).not.toMatch(/LIMIT|DISTINCT/i);
      expect(result.data).toHaveLength(200);
      expect(result.data.filter((row) => row.records__value === null)).toHaveLength(20);
      expect(result).toMatchObject({ truncated: true, truncatedBy: 'maxRows' });
      expect(result.rowCount).toBeUndefined();
      expect(model.doGenerateCalls).toHaveLength(3);
    } finally {
      await ava.dispose();
    }
  });

  it.each<{
    query: string;
    smq: SMQ;
    projection: string;
    expected: boolean | number | string;
  }>([
    {
      query: 'Does the oldest person have a score of 5?',
      smq: {
        group_by: ['people__name', 'people__age', 'people__score'],
        filters: ['people__age IS NOT NULL'],
        order_by: [{ field: 'people__age', direction: 'desc' }],
        limit: 1,
      },
      projection: 'COALESCE(people__score = 5, FALSE)',
      expected: false,
    },
    {
      query: 'What is the best rank among people who are not self-made?',
      smq: { metrics: ['people__best_rank'], filters: ['people__self_made = FALSE'] },
      projection: 'people__best_rank',
      expected: 7,
    },
    {
      query: "What is the youngest person's source of wealth?",
      smq: {
        group_by: ['people__name', 'people__age', 'people__wealth_source'],
        filters: ['people__age IS NOT NULL'],
        order_by: [{ field: 'people__age', direction: 'asc' }],
        limit: 1,
      },
      projection: 'people__wealth_source',
      expected: 'software',
    },
  ])('$query', async ({ query, smq, projection, expected }) => {
    const responses = [call('getModelDataElements', {}), call('convertSmqToSql', smq)];
    const model = new MockLanguageModelV3({
      doGenerate: async (options) => {
        if (responses.length) return responses.shift()!;
        const message = options.prompt[options.prompt.length - 1];
        if (message.role !== 'tool') throw new Error('Expected native tool results');
        const output = message.content[0];
        if (output.type !== 'tool-result' || output.output.type !== 'json') throw new Error('Expected JSON result');
        const runtime = output.output.value as { sql: string; columns: string[] };
        expect(runtime.columns).toContain(projection.includes('score') ? 'people__score' : projection);
        return call('execute', {
          sql: `WITH smq_result AS (${runtime.sql}) SELECT ${projection} AS answer FROM smq_result`,
        });
      },
    });
    const ava = new AVA({ llm: { model } });
    try {
      await ava.source({
        type: 'json',
        options: {
          data: [
            { name: 'Oldest', age: 95, philanthropyScore: null, selfMade: true, rank: 1, source: 'retail' },
            { name: 'Youngest', age: 21, philanthropyScore: 5, selfMade: false, rank: 7, source: 'software' },
            { name: 'Other', age: 40, philanthropyScore: 3, selfMade: false, rank: 12, source: 'manufacturing' },
          ],
        },
      });
      ava.semantic({
        models: [
          {
            name: 'people',
            table: 'data',
            dimensions: [
              { name: 'name', column: 'name' },
              { name: 'age', column: 'age' },
              { name: 'score', column: 'philanthropyScore' },
              { name: 'self_made', column: 'selfMade' },
              { name: 'wealth_source', column: 'source' },
            ],
            metrics: [{ name: 'best_rank', agg: 'min', column: 'rank' }],
          },
        ],
      });
      const result = await ava.analyze(query, { strategy: { type: 'semantic' }, includeSummary: false });

      expect(result.data).toEqual([{ answer: expected }]);
      expect(model.doGenerateCalls).toHaveLength(3);
      expect(result.sql).toContain('WITH smq_result AS');
    } finally {
      await ava.dispose();
    }
  });
});
