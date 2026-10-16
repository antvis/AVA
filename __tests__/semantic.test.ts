import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { AVA } from '../src';
import { analyze } from '../src/analysis';
import { findDisallowedTables } from '../src/analysis/semantic';
import { SemanticRegistry } from '../src/semantic/registry';
import { compileSMQ } from '../src/semantic/compiler';

import type { AnalysisEngine, SemanticConfig } from '../src';

vi.mock('ai', () => ({
  generateText: vi.fn(),
  experimental_evaluate: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({ chat: vi.fn() })),
}));

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
      measures: [
        { name: 'revenue', agg: 'sum', column: 'amount' },
        { name: 'count', agg: 'count' },
        { name: 'buyers', agg: 'count_distinct', column: 'customer_id' },
      ],
    },
    {
      name: 'customers',
      table: 'main.customers',
      dimensions: [{ name: 'region', column: 'region' }],
      measures: [{ name: 'signups', agg: 'count' }],
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
    expect(compileSMQ(registry(), smq).sql).toContain('= \'it\'\'s\'');
    expect(compileSMQ(registry(), smq, 'mysql').sql).toContain('`orders`.`status`');
  });

  it('selects DISTINCT dimensions when no metrics are requested', () => {
    expect(compileSMQ(registry(), { group_by: ['orders__channel'] }).sql).toMatch(/^SELECT DISTINCT/);
  });

  it.each([
    [{}, 'at least one'],
    [{ metrics: ['orders__nope'] }, 'Unknown element'],
    [{ metrics: ['nope__x'] }, 'Unknown semantic model'],
    [{ metrics: ['orders'] }, 'Invalid element reference'],
    [{ metrics: ['orders__status'] }, 'requires a measure'],
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
        { name: 'a', table: 'a', measures: [{ name: 'n', agg: 'count' }] },
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
      () => new SemanticRegistry({ models: [{ name: 'a', table: 'a' }], joins: [{ from: 'a', to: 'z', keys: [{ from: 'x', to: 'y' }] }] })
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
});

describe('findDisallowedTables', () => {
  const allowed = new Set(['orders', 'main.customers']);

  it('allows compiled tables, CTEs and EXTRACT(... FROM ...)', () => {
    const sql = `WITH t AS (SELECT EXTRACT(YEAR FROM o.created_at) y FROM "orders" o), u AS (SELECT * FROM t)
      SELECT * FROM u JOIN customers c ON 1 = 1 WHERE x = 'FROM secrets'`;
    expect(findDisallowedTables(sql, allowed)).toEqual([]);
  });

  it('flags other tables', () => {
    expect(findDisallowedTables('SELECT * FROM orders JOIN "users" u ON 1=1', allowed)).toEqual(['"users"']);
  });
});

describe('semantic strategy', () => {
  beforeEach(() => vi.clearAllMocks());

  const call = (tool: string, args: object) => ({ text: '```json\n' + JSON.stringify({ tool, args }) + '\n```' });

  function setup(responses: { text: string }[]) {
    const mock = vi.mocked(generateText);
    for (const response of responses) mock.mockResolvedValueOnce(response as never);

    const engine = {
      language: { name: 'DuckDB SQL', fence: 'sql' },
      execute: vi.fn().mockImplementation(async (sql: string) => ({
        schema: [{ name: 'v' }],
        data: [{ v: sql.length }],
        rowCount: 1,
      })),
    } as unknown as AnalysisEngine;
    const emit = vi.fn();
    const run = (strategy: { type: 'semantic'; maxSteps?: number } = { type: 'semantic' }) =>
      analyze(
        'revenue per channel',
        { strategy, includeSummary: false },
        {
          emit,
          context: { schema: { tables: [{ name: 'orders' }, { name: 'customers' }, { name: 'regions' }] } as never, profile: null },
          engine,
          llm: { model: 'test', apiKey: 'test' },
          semantic: registry(),
        }
      );
    return { engine, emit, run, mock };
  }

  it('runs discover → explore → compose → execute', async () => {
    const { engine, run, mock } = setup([
      call('getModelDataElements', {}),
      call('convertSmqToSql', { metrics: ['orders__revenue'], group_by: ['orders__channel'] }),
      call('execute', { sql: 'WITH r AS (SELECT 1 FROM "orders") SELECT * FROM r' }),
    ]);

    const result = await run();

    expect(mock).toHaveBeenCalledTimes(3);
    expect(String(mock.mock.calls[1][0].prompt)).toContain('orders__revenue');
    expect(String(mock.mock.calls[2][0].prompt)).toContain('"preview"');
    expect(engine.execute).toHaveBeenCalledTimes(2);
    expect(vi.mocked(engine.execute).mock.calls[0][1]).toMatchObject({ maxRows: 5 });
    expect(result.sql).toBe('WITH r AS (SELECT 1 FROM "orders") SELECT * FROM r');
    expect(result.data).toHaveLength(1);
  });

  it('rejects execute before any SMQ compiled and on foreign tables, without executing', async () => {
    const { engine, run, mock } = setup([
      call('execute', { sql: 'SELECT 1 FROM orders' }),
      call('convertSmqToSql', { metrics: ['orders__count'] }),
      call('execute', { sql: 'SELECT * FROM secrets' }),
      call('execute', { sql: 'SELECT * FROM orders' }),
    ]);

    await run();

    expect(mock).toHaveBeenCalledTimes(4);
    expect(String(mock.mock.calls[1][0].prompt)).toContain('at least once');
    expect(String(mock.mock.calls[3][0].prompt)).toContain('secrets');
    expect(engine.execute).toHaveBeenCalledTimes(2); // preview + final
  });

  it('feeds compile and protocol errors back to the model', async () => {
    const { run, mock } = setup([
      { text: 'not json' },
      call('convertSmqToSql', { metrics: ['orders__bogus'] }),
      call('convertSmqToSql', { metrics: ['orders__count'] }),
      call('execute', { sql: 'SELECT 1 FROM orders' }),
    ]);

    await run();

    expect(String(mock.mock.calls[1][0].prompt)).toContain('exactly one JSON tool call');
    expect(String(mock.mock.calls[2][0].prompt)).toContain('Unknown element');
  });

  it('does not retry a failed final execute', async () => {
    const { engine, run } = setup([
      call('convertSmqToSql', { metrics: ['orders__count'] }),
      call('execute', { sql: 'SELECT 1 FROM orders' }),
    ]);
    vi.mocked(engine.execute).mockResolvedValueOnce({ schema: [], data: [] }).mockRejectedValueOnce(new Error('boom'));

    await expect(run()).rejects.toThrow('boom');
    expect(engine.execute).toHaveBeenCalledTimes(2);
  });

  it('enforces the step limit', async () => {
    const { run, mock } = setup([call('getModelDataElements', {}), call('getModelDataElements', {})]);

    await expect(run({ type: 'semantic', maxSteps: 2 })).rejects.toThrow('step limit');
    expect(mock).toHaveBeenCalledTimes(2);
    expect(String(mock.mock.calls[1][0].prompt)).toContain('MUST respond with the execute');
  });

  it('requires a registered semantic layer', async () => {
    await expect(
      analyze('q', { strategy: { type: 'semantic' } }, {
        emit: vi.fn(),
        context: { schema: { tables: [] } as never, profile: null },
        engine: {} as AnalysisEngine,
        llm: { model: 'test' },
      })
    ).rejects.toThrow('semantic()');
  });
});

describe('AVA semantic API', () => {
  it('compiles SMQ without an engine, LLM or database', () => {
    const ava = new AVA({ llm: { model: 'test', apiKey: 'test' } });
    expect(() => ava.compileSMQ({ metrics: ['orders__count'] })).toThrow('semantic()');

    const { sql } = ava.semantic(config).compileSMQ({ metrics: ['orders__count'] });
    expect(sql).toContain('COUNT(*)');
    expect(generateText).not.toHaveBeenCalled();
  });

  it('executes compiled SQL on DuckDB', async () => {
    const ava = new AVA({ llm: { model: 'test', apiKey: 'test' } });
    await ava.source({
      type: 'json',
      options: {
        data: [
          { status: 'paid', channel: 'web', amount: 10 },
          { status: 'paid', channel: 'web', amount: 5 },
          { status: 'paid', channel: 'app', amount: 7 },
          { status: 'refunded', channel: 'app', amount: 99 },
        ],
      },
    });
    const table = (await ava.schema()).tables[0].name;
    ava.semantic({
      models: [
        {
          name: 'orders',
          table,
          dimensions: [{ name: 'status', column: 'status' }, { name: 'channel', column: 'channel' }],
          measures: [{ name: 'revenue', agg: 'sum', column: 'amount' }],
        },
      ],
    });

    const { sql } = ava.compileSMQ({
      metrics: ['orders__revenue'],
      filters: ["orders__status = 'paid'"],
      group_by: ['orders__channel'],
      order_by: [{ field: 'orders__channel' }],
    });
    const result = await ava.query(sql);
    expect(result.data).toEqual([
      { orders__channel: 'app', orders__revenue: 7 },
      { orders__channel: 'web', orders__revenue: 15 },
    ]);
    await ava.dispose();
  });
});
