import { afterEach, describe, expect, it, vi } from 'vitest';

import { getTenantAccessToken } from '../../../src/duckdb/loaders/feishu/token';

afterEach(() => vi.unstubAllGlobals());

const tokenRejected = (code: number, msg: string) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ code, msg }))
  );

describe('getTenantAccessToken', () => {
  it('returns the tenant access token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ code: 0, tenant_access_token: 't-123' }))
    );

    await expect(getTenantAccessToken('id', 'secret')).resolves.toBe('t-123');
  });

  it.each([
    [21001, 'Access denied due to platform policy.'],
    [91402, 'no access'],
    [10003, 'bad app'],
    [99999, 'weird'],
  ])('passes through code %s and its original message', async (code, msg) => {
    tokenRejected(code, msg);

    await expect(getTenantAccessToken('id', 'secret')).rejects.toEqual(new Error(`Feishu Error ${code}: ${msg}`));
  });

  it('rejects a successful response without a token', async () => {
    tokenRejected(0, 'ok');

    await expect(getTenantAccessToken('id', 'secret')).rejects.toThrow('Feishu Error 0: ok');
  });

  it('reports a non JSON token response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>not json</html>'))
    );

    await expect(getTenantAccessToken('id', 'secret')).rejects.toThrow('response is not JSON');
  });
});
