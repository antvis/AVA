/**
 * Unit test for src/saas/supabase/engine.ts (SupabaseEngine).
 * Global fetch is stubbed — the Management API is never actually called.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { PgParser, unwrapParseResult } from '@supabase/pg-parser';

import { AVA } from '../../src';
import { BUILTIN_METRICS as PG_METRICS, profileTables as pgProfile } from '../../src/saas/supabase/profile';
import { SupabaseEngine } from '../../src/saas';
import { PostgreSQLQueryDialect } from '../../src/query/postgresql';
import { getLLMConfig } from '../test-utils';

import type { Schema } from '../../src/types';

const CONNECTION = { accessToken: 'token-123', projectRef: 'demo-ref' };

/** Tagged catalog rows returned by the single metadata query. */
const DISCOVERY_ROWS = [
  {
    kind: 'column',
    table_name: 'users',
    metadata: JSON.stringify({ name: 'id', type: 'bigint', nullable: false, position: 1 }),
  },
  {
    kind: 'column',
    table_name: 'users',
    metadata: JSON.stringify({ name: 'name', type: 'text', nullable: true, position: 2 }),
  },
  {
    kind: 'index',
    table_name: 'users',
    metadata: JSON.stringify({
      name: 'users_pkey',
      unique: true,
      primary: true,
      definition: 'CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)',
    }),
  },
  {
    kind: 'index',
    table_name: 'users',
    metadata: JSON.stringify({
      name: 'idx_users_name',
      unique: false,
      primary: false,
      definition: 'CREATE INDEX idx_users_name ON public.users USING btree (name)',
    }),
  },
];

/** Stub global fetch to answer Management API calls; records request shapes */
function stubApi(payloads: Array<{ match?: RegExp; rows: unknown[] }>) {
  const requests: Array<{ url: string; headers: any; body: any }> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: any) => {
      const body = JSON.parse(init.body);
      requests.push({ url, headers: init.headers, body });
      const matched = payloads.find((p) => !p.match || p.match.test(body.query)) ?? payloads[payloads.length - 1];
      return { ok: true, status: 200, json: async () => matched.rows, text: async () => '' };
    })
  );
  return requests;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('SupabaseEngine', () => {
  describe('schema', () => {
    it.each([200, 503])('times out while reading an HTTP %s response body', async (status) => {
      vi.useFakeTimers();
      let bodyStarted = false;
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init: { signal: AbortSignal }) => {
          expect(url).toContain('/database/query');
          const readBody = () =>
            new Promise((_, reject) => {
              bodyStarted = true;
              init.signal.addEventListener(
                'abort',
                () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
                { once: true }
              );
            });
          return { ok: status === 200, status, json: readBody, text: readBody };
        })
      );
      const engine = new SupabaseEngine(getLLMConfig());
      const pending = expect(engine.load({ type: 'supabase', options: CONNECTION })).rejects.toMatchObject({
        name: 'SupabaseApiError',
        message: 'Supabase API request timed out',
        status: 0,
      });
      await vi.advanceTimersByTimeAsync(29_999);
      expect(bodyStarted).toBe(true);
      expect(vi.getTimerCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(1);
      await pending;
      expect(vi.getTimerCount()).toBe(0);
      await expect(engine.profile()).rejects.toThrow('No data loaded');
    });

    it('discovers multiple tables and relations in one request and passes them to SQL generation', async () => {
      const requests = stubApi([
        {
          rows: [
            ...DISCOVERY_ROWS,
            {
              kind: 'column',
              table_name: 'orders',
              metadata: JSON.stringify({ name: 'buyer_id', type: 'bigint', nullable: true, position: 1 }),
            },
            {
              kind: 'foreign-key-column',
              table_name: 'orders',
              metadata: JSON.stringify({
                name: 'buyer_fk',
                column: 'buyer_id',
                referencedTable: 'users',
                referencedColumn: 'id',
                position: 1,
              }),
            },
          ],
        },
      ]);
      const engine = new SupabaseEngine(getLLMConfig());
      const schema = await engine.load({ type: 'supabase', options: CONNECTION });
      expect(requests).toHaveLength(1);
      const parsed = await unwrapParseResult(new PgParser().parse(requests[0].body.query));
      expect(parsed.stmts).toHaveLength(1);
      expect(parsed.stmts![0].stmt).toHaveProperty('SelectStmt');
      expect(schema.relations).toEqual([
        {
          name: 'buyer_fk',
          kind: 'foreign-key',
          from: { table: 'orders', columns: ['buyer_id'] },
          to: { table: 'users', columns: ['id'] },
        },
      ]);
      const generate = vi.spyOn(PostgreSQLQueryDialect.prototype, 'getDSL').mockResolvedValue('SELECT 1');
      await engine.getDSL('Orders by buyer');
      expect(generate).toHaveBeenCalledWith('Orders by buyer', { schema });
      expect(requests).toHaveLength(1);
    });

    it('clears request timers on success and preserves HTTP errors', async () => {
      vi.useFakeTimers();
      stubApi([{ rows: [] }]);
      const engine = new SupabaseEngine(getLLMConfig());
      await engine.load({ type: 'supabase', options: CONNECTION });
      expect(vi.getTimerCount()).toBe(0);
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ ok: false, status: 403, text: async () => 'denied' }))
      );
      await expect(engine.load({ type: 'supabase', options: CONNECTION })).rejects.toMatchObject({
        name: 'SupabaseApiError',
        message: 'Supabase API request failed (403): denied',
        status: 403,
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it('discovers multiple tables and relations in one request and passes them to SQL generation', async () => {
      const requests = stubApi([
        {
          rows: [
            ...DISCOVERY_ROWS,
            {
              kind: 'column',
              table_name: 'orders',
              metadata: JSON.stringify({ name: 'buyer_id', type: 'bigint', nullable: true, position: 1 }),
            },
            {
              kind: 'foreign-key-column',
              table_name: 'orders',
              metadata: JSON.stringify({
                name: 'buyer_fk',
                column: 'buyer_id',
                referencedTable: 'users',
                referencedColumn: 'id',
                position: 1,
              }),
            },
          ],
        },
      ]);
      const engine = new SupabaseEngine(getLLMConfig());
      const schema = await engine.load({ type: 'supabase', options: CONNECTION });
      expect(requests).toHaveLength(1);
      const parsed = await unwrapParseResult(new PgParser().parse(requests[0].body.query));
      expect(parsed.stmts).toHaveLength(1);
      expect(parsed.stmts![0].stmt).toHaveProperty('SelectStmt');
      expect(requests[0].body.read_only).toBe(true);
      expect(schema.tables.find(({ name }) => name === 'users')).toMatchObject({
        fields: [
          { name: 'id', type: 'bigint', nullable: false },
          { name: 'name', type: 'text', nullable: true },
        ],
        indexes: [
          { name: 'idx_users_name', columns: ['name'], unique: false, primary: false },
          { name: 'users_pkey', columns: ['id'], unique: true, primary: true },
        ],
      });
      expect(schema.relations).toEqual([
        {
          name: 'buyer_fk',
          kind: 'foreign-key',
          from: { table: 'orders', columns: ['buyer_id'] },
          to: { table: 'users', columns: ['id'] },
        },
      ]);
      const generate = vi.spyOn(PostgreSQLQueryDialect.prototype, 'getDSL').mockResolvedValue('SELECT 1');
      await engine.getDSL('Orders by buyer');
      expect(generate).toHaveBeenCalledWith('Orders by buyer', { schema });
      expect(requests).toHaveLength(1);
    });
  });

  describe('execute', () => {
    it('executes SQL remotely with bounded results', async () => {
      const requests = stubApi([
        { match: /pg_catalog.pg_constraint/, rows: DISCOVERY_ROWS },
        { rows: [{ name: 'Alice' }] },
      ]);
      const engine = new SupabaseEngine(getLLMConfig());
      await engine.load({ type: 'supabase', options: CONNECTION });

      const rows = await engine.execute('SELECT name FROM users');
      expect(rows.data).toEqual([{ name: 'Alice' }]);
      expect(requests[1].body.query).toContain('LIMIT 201');

      const result = await engine.execute('SELECT name FROM users', { maxRows: 2 });
      expect(result.data).toEqual([{ name: 'Alice' }]);
      expect(result.rowCount).toBe(1);
      expect(requests[2].body.query).toContain('LIMIT 3');
    });

    it('requires one read-only statement', async () => {
      const requests = stubApi([{ match: /pg_catalog.pg_constraint/, rows: DISCOVERY_ROWS }, { rows: [] }]);
      const engine = new SupabaseEngine(getLLMConfig());
      await engine.load({ type: 'supabase', options: CONNECTION });

      await expect(engine.execute('SELECT 1; SELECT 2')).rejects.toThrow('exactly one');
      await expect(engine.execute('DELETE FROM users')).rejects.toThrow('only read-only SELECT statements');
      await expect(engine.execute('SELECT 1; DELETE FROM users')).rejects.toThrow('only read-only SELECT statements');
      await expect(engine.execute('SELECT * FROM users FOR UPDATE')).rejects.toThrow(
        'only read-only SELECT statements'
      );
      await expect(
        engine.execute('WITH deleted AS (DELETE FROM users RETURNING *) SELECT * FROM deleted')
      ).rejects.toThrow('only read-only SELECT statements');
      expect(requests).toHaveLength(1);
    });
  });

  describe('profile', () => {
    const metrics = PG_METRICS.map(({ id }) => ({ id }));
    const schema: Schema = {
      tables: [
        {
          name: 'order notes',
          columnCount: 4,
          indexes: [],
          fields: [
            { name: 'n', type: 'double precision' },
            { name: 'note"text', type: 'text' },
            { name: 'day', type: 'timestamp(3) without time zone' },
            { name: 'extra', type: 'json' },
          ],
        },
      ],
    };

    it('batches quoted aggregates, parses valid PostgreSQL and normalizes results', async () => {
      const run = vi
        .fn<(sql: string) => Promise<Record<string, unknown>[]>>()
        .mockResolvedValue([{ m0: '4', m1: 'NaN', m2: [{ value: 'A', count: 2 }] }]);
      const selected = { metrics: [{ id: 'row_count' }, { id: 'mean' }, { id: 'top_values' }] };
      const result = await pgProfile(run, schema, selected);
      expect(run).toHaveBeenCalledTimes(1);
      expect(result.tables[0].metrics.row_count).toBe(4);
      expect(result.tables[0].fields[0].metrics.mean).toBeNull();
      expect(result.tables[0].fields[1].metrics.top_values).toEqual([{ value: 'A', count: 2 }]);
      const query = run.mock.calls[0][0];
      expect(query).toContain('"public"."order notes"');
      expect(query).toContain('"note""text"');
      await pgProfile(
        async (sql) => {
          const parsed = await unwrapParseResult(new PgParser().parse(sql));
          expect(parsed.stmts).toHaveLength(1);
          expect(sql).toContain('percentile_cont(0.5)');
          expect(sql).toContain('isfinite("day")');
          return [{}];
        },
        schema,
        { metrics }
      );
      run.mockClear();
      await pgProfile(run, schema, { metrics: [] });
      expect(run).not.toHaveBeenCalled();
      await expect(
        pgProfile(
          async () => {
            throw new Error('query failed');
          },
          schema,
          selected
        )
      ).rejects.toThrow('query failed');
    });

    it('uses the public API, cached schema and read-only Management API requests', async () => {
      const fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ kind: 'table', table_name: 'orders', metadata: '{}' }],
        })
        .mockResolvedValueOnce({ ok: true, json: async () => [{ m0: '4' }] });
      vi.stubGlobal('fetch', fetch);
      const ava = new AVA({ llm: getLLMConfig(), engine: { type: 'supabase' } });
      try {
        await ava.load({ type: 'supabase', options: { accessToken: 'test', projectRef: 'test' } });
        expect((await ava.profile()).tables[0].metrics).toEqual({ row_count: 4 });
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({ read_only: true });
        expect(fetch.mock.calls[1][1].signal).toBeInstanceOf(AbortSignal);
        await ava.profile({ metrics: [] });
        expect(fetch).toHaveBeenCalledTimes(2);
      } finally {
        await ava.dispose();
      }
    });

    it('rejects unloaded/disposed/failed loads and invalid options', async () => {
      stubApi([{ rows: [] }]);
      const engine = new SupabaseEngine(getLLMConfig());
      const config = { type: 'supabase' as const, options: CONNECTION };
      await expect(engine.profile()).rejects.toThrow('No data loaded');
      await engine.load(config);
      for (const limit of [NaN, -1]) {
        await expect(engine.profile({ metrics: [{ id: 'top_values', limit }] })).rejects.toThrow('top_values.limit');
      }
      await expect(engine.profile({ metrics: ['missing'] })).rejects.toThrow('Unknown metric');
      await expect(engine.profile({ metrics: [{ id: 'row_count', limit: 2 }] })).rejects.toThrow('Unknown option');
      await engine.dispose();
      await expect(engine.profile()).rejects.toThrow('No data loaded');
      await engine.load(config);
      await expect(engine.load({ type: 'csv-file', options: { path: 'unused' } })).rejects.toThrow('only supports');
      await expect(engine.profile()).rejects.toThrow('No data loaded');
    });
  });
});
