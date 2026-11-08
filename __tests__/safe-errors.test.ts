import { generateText } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AVA, AVAError, serializeError } from '../src';
import { ClickHouseEngine } from '../src/remote';
import { failureResponse } from '../src/util/error';
import { responseSchema } from '../src/cli/session/protocol';
import { readJSON } from '../src/cli/io';
import { formatError } from '../src/cli/util';

vi.mock('ai', async (original) => ({ ...(await original<typeof import('ai')>()), generateText: vi.fn() }));

const secret = 'driver echoed only partial%2Fcredential';
const source = {
  type: 'clickhouse' as const,
  options: { host: 'localhost', database: 'sales', password: 'dummy-password' },
};
const schema = {
  models: [{ name: 'data', tableReference: { table: 'data' }, columns: [{ name: 'total', type: 'DOUBLE' }] }],
  relationships: [],
};
let ava: AVA;
let events: unknown[];

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(ClickHouseEngine.prototype, 'load').mockResolvedValue(undefined);
  vi.spyOn(ClickHouseEngine.prototype, 'dispose').mockResolvedValue(undefined);
  vi.spyOn(ClickHouseEngine.prototype, 'schema').mockResolvedValue(schema);
  vi.spyOn(ClickHouseEngine.prototype, 'getDSL').mockResolvedValue({ dsl: 'SELECT 10 AS total' });
  vi.spyOn(ClickHouseEngine.prototype, 'execute').mockResolvedValue({
    schema: [{ name: 'total' }],
    data: [{ total: 10 }],
    rowCount: 1,
  });
  ava = new AVA({ llm: { model: 'unused', apiKey: 'dummy-key' }, engine: { type: 'clickhouse' } });
  events = [];
  ava.on('*', (event: unknown) => events.push(event));
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await ava.dispose().catch(() => {});
});

function assertSafe(error: unknown, code: string) {
  expect(error).toBeInstanceOf(AVAError);
  expect(error).toMatchObject({ code, outcome: 'failed' });
  expect(String(error)).not.toContain(secret);
  expect(JSON.stringify(events)).not.toContain(secret);
}

describe('safe SDK errors', () => {
  it('normalizes loading failures before emitting events or propagating to callers', async () => {
    vi.mocked(ClickHouseEngine.prototype.load).mockRejectedValue(new Error(secret));
    await ava.source(source).catch((error) => assertSafe(error, 'SOURCE_ERROR'));
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'sourceend',
        data: expect.objectContaining({ error: expect.objectContaining({ code: 'SOURCE_ERROR' }) }),
      })
    );
  });

  it.each(['schema', 'profile', 'query', 'dispose'] as const)(
    'normalizes remote %s failures at the SDK boundary',
    async (operation) => {
      await ava.source(source);
      const method = operation === 'query' ? 'execute' : operation;
      vi.spyOn(ClickHouseEngine.prototype, method).mockRejectedValue(new Error(secret));
      const result = operation === 'query' ? ava.query('SELECT 10') : ava[operation]();
      await expect(result).rejects.toBeInstanceOf(AVAError);
      await result.catch((error) => assertSafe(error, 'SOURCE_ERROR'));
    }
  );

  it('retains protection when a pending operation fails after dispose clears the source', async () => {
    await ava.source(source);
    let rejectQuery!: (error: Error) => void;
    vi.mocked(ClickHouseEngine.prototype.execute).mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectQuery = reject;
        })
    );
    const query = ava.query('SELECT 10');
    const check = expect(query).rejects.toMatchObject({ code: 'SOURCE_ERROR' });
    await ava.dispose();
    rejectQuery(new Error(secret));
    await check;
    expect(JSON.stringify(events)).not.toContain(secret);
  });

  it('keeps driver errors out of direct-analysis events and correction prompts', async () => {
    await ava.source(source);
    vi.mocked(ClickHouseEngine.prototype.execute).mockRejectedValueOnce(new Error(secret));
    const result = await ava.analyze('Total?', { includeSummary: false });
    expect(result.data).toEqual([{ total: 10 }]);
    const correction = vi.mocked(ClickHouseEngine.prototype.getDSL).mock.calls[1][0];
    expect(correction).toContain('clickhouse operation failed');
    expect(correction).not.toContain(secret);
    expect(JSON.stringify(events)).not.toContain(secret);
  });

  it('keeps driver errors out of loop-analysis events and subsequent model prompts', async () => {
    await ava.source(source);
    vi.mocked(ClickHouseEngine.prototype.execute).mockRejectedValueOnce(new Error(secret));
    vi.mocked(generateText)
      .mockResolvedValueOnce({ text: '[SQL]\n```sql\nSELECT 10 AS total\n```' } as never)
      .mockResolvedValueOnce({ text: '[SQL]\n```sql\nSELECT 10 AS total\n```' } as never);
    const result = await ava.analyze('Total?', { includeSummary: false, strategy: { type: 'loop', maxSteps: 2 } });
    expect(result.data).toEqual([{ total: 10 }]);
    expect(JSON.stringify(vi.mocked(generateText).mock.calls)).not.toContain(secret);
    expect(JSON.stringify(events)).not.toContain(secret);
  });

  it.each(['direct', 'loop'] as const)('does not retry %s execution after an unknown outcome', async (strategy) => {
    await ava.source(source);
    vi.mocked(ClickHouseEngine.prototype.execute).mockRejectedValueOnce(
      new AVAError('REQUEST_TIMEOUT', 'Query may still be running', 'unknown')
    );
    vi.mocked(generateText).mockResolvedValueOnce({ text: '[SQL]\n```sql\nSELECT 10 AS total\n```' } as never);
    await expect(ava.analyze('Total?', { includeSummary: false, strategy: { type: strategy } })).rejects.toMatchObject({
      code: 'REQUEST_TIMEOUT',
      outcome: 'unknown',
    });
    expect(ClickHouseEngine.prototype.execute).toHaveBeenCalledOnce();
  });

  it('preserves an unknown execution outcome from the loop final fallback', async () => {
    await ava.source(source);
    vi.mocked(ClickHouseEngine.prototype.execute).mockRejectedValueOnce(
      new AVAError('REQUEST_TIMEOUT', 'Query may still be running', 'unknown')
    );
    vi.mocked(generateText)
      .mockResolvedValueOnce({ text: '[REFINE] Need to query.' } as never)
      .mockResolvedValueOnce({ text: '[SQL]\n```sql\nSELECT 10 AS total\n```' } as never);
    await expect(
      ava.analyze('Total?', { includeSummary: false, strategy: { type: 'loop', maxSteps: 1 } })
    ).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT', outcome: 'unknown' });
    expect(ClickHouseEngine.prototype.execute).toHaveBeenCalledOnce();
  });

  it('normalizes model failures for recommendation and SDK analysis', async () => {
    vi.mocked(generateText).mockRejectedValueOnce(new Error(secret));
    const recommendation = ava.recommend({ query: 'Total?', data: [{ total: 10 }] });
    await expect(recommendation).rejects.toMatchObject({ code: 'MODEL_ERROR' });
    await recommendation.catch((error) => assertSafe(error, 'MODEL_ERROR'));
    await ava.source(source);
    vi.mocked(ClickHouseEngine.prototype.getDSL).mockRejectedValueOnce(new Error(secret));
    await expect(ava.analyze('Total?')).rejects.toMatchObject({ code: 'MODEL_ERROR' });
    expect(JSON.stringify(events)).not.toContain(secret);
  });
});

describe('structured error protocol', () => {
  it('keeps old IPC failures compatible and serializes stable codes/outcomes', () => {
    expect(responseSchema.parse({ ok: false, error: 'Legacy message' })).toEqual({
      ok: false,
      error: 'Legacy message',
    });
    const error = new AVAError('REQUEST_TIMEOUT', 'Operation may still be running.', 'unknown');
    expect(serializeError(error)).toMatchObject({ code: 'REQUEST_TIMEOUT', outcome: 'unknown' });
    expect(responseSchema.parse(failureResponse(error))).toEqual({
      ok: false,
      error: error.message,
      code: error.code,
      outcome: error.outcome,
    });
    vi.stubEnv('AVA_ERROR_FORMAT', 'json');
    expect(JSON.parse(formatError(error))).toEqual(failureResponse(error));
  });

  it('does not echo malformed JSON source credentials', async () => {
    await expect(readJSON(`{"password":"${secret}"`)).rejects.toThrow('Cannot read JSON: invalid JSON input.');
    await readJSON(`{"password":"${secret}"`).catch((error) => expect(String(error)).not.toContain(secret));
  });
});
