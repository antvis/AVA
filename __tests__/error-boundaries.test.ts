import { generateText as sdkGenerateText } from 'ai';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA, AVAError, serializeError } from '../src';
import { failureResponse } from '../src/util/error';
import { generateText } from '../src/util/model';
import { safeSourceError } from '../src/util/source-error';

vi.mock('ai', async (original) => ({ ...(await original<typeof import('ai')>()), generateText: vi.fn() }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

const secret = 'dummy%2Ftransformed-credential';

describe('error boundaries', () => {
  it.each([
    ['postgresql', { code: '42703' }],
    ['mysql', { code: 'ER_BAD_FIELD_ERROR' }],
    ['clickhouse', { code: '47' }],
    ['sqlserver', { code: 'EREQUEST', number: 207 }],
  ] as const)('retains a useful %s query diagnostic without forwarding native text or properties', (source, fields) => {
    const native = Object.assign(new Error(secret), fields, { detail: secret, headers: { authorization: secret } });
    const error = safeSourceError(native, source);
    expect(error).toMatchObject({
      code: 'QUERY_ERROR',
      outcome: 'failed',
      message: expect.stringContaining('unknown column'),
    });
    expect(error).not.toHaveProperty('detail');
    expect(error).not.toHaveProperty('headers');
    expect(JSON.stringify(failureResponse(error))).not.toContain(secret);
  });

  it.each([
    ['ETIMEDOUT', 'REQUEST_TIMEOUT'],
    ['ECONNRESET', 'CONNECTION_LOST'],
  ])('preserves uncertainty for native %s errors', (nativeCode, code) => {
    const error = safeSourceError(Object.assign(new Error(secret), { code: nativeCode }), 'clickhouse');
    expect(error).toMatchObject({ code, outcome: 'unknown' });
    expect(JSON.stringify(serializeError(error))).not.toContain(secret);
  });

  it('keeps an already classified error unchanged across boundaries and serialization', async () => {
    const error = new AVAError('QUERY_ERROR', 'The query references an unknown column.');
    expect(safeSourceError(error, 'clickhouse')).toBe(error);
    vi.mocked(sdkGenerateText).mockRejectedValueOnce(error);
    await expect(generateText({ model: 'unused', prompt: 'Test', maxRetries: 0 })).rejects.toBe(error);
    expect(failureResponse(error)).toEqual({ ok: false, error: error.message, code: 'QUERY_ERROR', outcome: 'failed' });
  });

  it.each([
    [401, 'authentication'],
    [429, 'rate limit'],
  ])('retains a safe model diagnostic for HTTP %s', async (statusCode, diagnostic) => {
    vi.mocked(sdkGenerateText).mockRejectedValueOnce(Object.assign(new Error(secret), { statusCode }));
    const result = generateText({ model: 'unused', prompt: 'Test', maxRetries: 0 });
    await expect(result).rejects.toMatchObject({ code: 'MODEL_ERROR', message: expect.stringContaining(diagnostic) });
    await result.catch((error) => expect(JSON.stringify(failureResponse(error))).not.toContain(secret));
  });

  it('does not expose a remote file URL token in SDK errors or events', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    const ava = new AVA({ llm: { model: 'unused' } });
    const events: unknown[] = [];
    ava.on('*', (event: unknown) => events.push(event));
    try {
      const failure = ava.source({
        type: 'csv-file',
        options: { path: `https://example.test/sales.csv?token=${secret}` },
      });
      await expect(failure).rejects.toMatchObject({ code: 'SOURCE_ERROR' });
      await failure.catch((error) => {
        expect(String(error)).not.toContain(secret);
        expect(JSON.stringify(failureResponse(error))).not.toContain(secret);
      });
      expect(JSON.stringify(events)).not.toContain(secret);
    } finally {
      await ava.dispose();
    }
  });

  it('classifies local query validation without changing its diagnostic', async () => {
    const ava = new AVA({ llm: { model: 'unused' } });
    try {
      await ava.source({ type: 'json', options: { data: [{ value: 1 }] } });
      await expect(ava.query('CREATE TABLE blocked (value INTEGER)')).rejects.toMatchObject({
        code: 'QUERY_ERROR',
        outcome: 'failed',
        message: expect.stringContaining('read-only SELECT'),
      });
    } finally {
      await ava.dispose();
    }
  });

  it('keeps Python compiler transport failures distinct from invalid query syntax', async () => {
    const execute = vi.fn().mockRejectedValue(Object.assign(new Error(secret), { code: 'ETIMEDOUT' }));
    const ava = new AVA({ llm: { model: 'unused' }, engine: { type: 'python', execute } });
    try {
      await ava.source({ type: 'csv-file', options: { path: 'https://example.test/sales.csv' } });
      const result = ava.query('result = 1');
      await expect(result).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT', outcome: 'unknown' });
      await result.catch((error) => expect(String(error)).not.toContain(secret));
      expect(execute).toHaveBeenCalledOnce();
    } finally {
      await ava.dispose();
    }
  });
});
