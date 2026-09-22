/**
 * Unit test for src/saas/supabase.ts (SupabaseEngine).
 * Global fetch is stubbed — the Management API is never actually called.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { PgParser, unwrapParseResult } from '@supabase/pg-parser';

import { SupabaseEngine } from '../../src/saas';
import { PostgreSQLQueryDialect } from '../../src/query/postgresql';
import { getLLMConfig, skipLLMTests } from '../test-utils';

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
});

describe('SupabaseEngine', () => {
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
    expect(generate).toHaveBeenCalledWith('Orders by buyer', schema);
    expect(requests).toHaveLength(1);
  });

  it('loads the public-schema tables and executes SQL remotely', async () => {
    const requests = stubApi([
      { match: /pg_catalog.pg_constraint/, rows: DISCOVERY_ROWS },
      { rows: [{ name: 'Alice' }] },
    ]);

    const engine = new SupabaseEngine(getLLMConfig());
    const schema = await engine.load({ type: 'supabase', options: CONNECTION });

    expect(requests[0].url).toBe('https://api.supabase.com/v1/projects/demo-ref/database/query');
    expect(requests[0].headers.Authorization).toBe('Bearer token-123');
    expect(requests[0].body.read_only).toBe(true);

    expect(schema.tables).toEqual([
      {
        name: 'users',
        columnCount: 2,
        fields: [
          { name: 'id', type: 'bigint', nullable: false },
          { name: 'name', type: 'text', nullable: true },
        ],
        indexes: [
          { name: 'idx_users_name', columns: ['name'], unique: false, primary: false },
          { name: 'users_pkey', columns: ['id'], unique: true, primary: true },
        ],
      },
    ]);

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
    await expect(engine.execute('SELECT * FROM users FOR UPDATE')).rejects.toThrow('only read-only SELECT statements');
    await expect(
      engine.execute('WITH deleted AS (DELETE FROM users RETURNING *) SELECT * FROM deleted')
    ).rejects.toThrow('only read-only SELECT statements');
    expect(requests).toHaveLength(1);
  });

  describe.skipIf(skipLLMTests)('getDSL', () => {
    it('generates PostgreSQL-flavored SQL from a natural language query', async () => {
      stubApi([{ match: /pg_catalog.pg_constraint/, rows: DISCOVERY_ROWS }, { rows: [] }]);

      const engine = new SupabaseEngine(getLLMConfig());
      await engine.load({ type: 'supabase', options: CONNECTION });
      // getDSL calls the LLM endpoint — restore the real fetch so the stub does not intercept it
      vi.unstubAllGlobals();

      const sql = await engine.getDSL('List all user names');
      expect(sql.toLowerCase()).toContain('select');
      expect(sql).not.toContain('```');
    }, 30000);
  });
});
