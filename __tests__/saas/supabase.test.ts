/**
 * Unit test for src/saas/supabase.ts (SupabaseEngine).
 * Global fetch is stubbed — the Management API is never actually called.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { SupabaseEngine } from '../../src/saas';
import { getLLMConfig, skipLLMTests } from '../test-utils';

const CONNECTION = { accessToken: 'token-123', projectRef: 'demo-ref' };

/** Discovery rows for one table, as returned by the information_schema query */
const DISCOVERY_ROWS = [
  { table_name: 'users', column_name: 'id', data_type: 'bigint', ordinal_position: 1, reltuples: 3 },
  { table_name: 'users', column_name: 'name', data_type: 'text', ordinal_position: 2, reltuples: 3 },
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

afterEach(() => vi.unstubAllGlobals());

describe('SupabaseEngine', () => {
  it('loads the public-schema tables and executes SQL remotely', async () => {
    const requests = stubApi([
      { match: /information_schema/, rows: DISCOVERY_ROWS },
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
        rowCount: 3,
        columnCount: 2,
        fields: [
          { name: 'id', type: 'number', rawType: 'bigint' },
          { name: 'name', type: 'string', rawType: 'text' },
        ],
      },
    ]);

    const rows = await engine.execute('SELECT name FROM users');
    expect(rows).toEqual([{ name: 'Alice' }]);
    expect(requests[1].body).toEqual({ query: 'SELECT name FROM users', read_only: true });
  });

  it('rejects multiple or non-read-only SQL statements', async () => {
    const requests = stubApi([{ rows: DISCOVERY_ROWS }]);
    const engine = new SupabaseEngine(getLLMConfig());
    await engine.load({ type: 'supabase', options: CONNECTION });

    await expect(engine.execute('SELECT 1; SELECT 2')).rejects.toThrow('exactly one statement');
    await expect(engine.execute('DELETE FROM users')).rejects.toThrow('read-only SELECT');
    await expect(
      engine.execute('WITH deleted AS (DELETE FROM users RETURNING *) SELECT * FROM deleted')
    ).rejects.toThrow('read-only SELECT');
    expect(requests).toHaveLength(1);
  });

  describe.skipIf(skipLLMTests)('getDSL', () => {
    it('generates PostgreSQL-flavored SQL from a natural language query', async () => {
      stubApi([{ rows: DISCOVERY_ROWS }]);

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
