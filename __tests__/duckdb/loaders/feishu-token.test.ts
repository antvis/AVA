import { afterEach, describe, expect, it, vi } from 'vitest';

import { feishuError, getTenantAccessToken } from '../../../src/duckdb/loaders/feishu/token';

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

  it('explains 21001 as a platform policy denial of the app account', async () => {
    tokenRejected(21001, 'Access denied due to platform policy.');

    const error = await getTenantAccessToken('id', 'secret').catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('21001');
    expect((error as Error).message).toContain('tenant_access_token');
    expect((error as Error).message).toContain('Doubao');
    expect((error as Error).message).toContain('phone number');
  });

  it('keeps the table and app specific hints for 91402 and 10003', () => {
    expect(feishuError(91402, 'no access').message).toContain('not authorized to access it');
    expect(feishuError(10003, 'bad app').message).toContain('appId and appSecret');
  });

  it('falls back to a generic permission hint for unknown codes', async () => {
    tokenRejected(99999, 'weird');

    await expect(getTenantAccessToken('id', 'secret')).rejects.toThrow(
      'Feishu Error 99999: weird.please check your permissions or this table Url.'
    );
  });

  it('reports a non JSON token response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>not json</html>'))
    );

    await expect(getTenantAccessToken('id', 'secret')).rejects.toThrow('response is not JSON');
  });
});
