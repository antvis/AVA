import { generateText } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../src';

vi.mock('ai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ai')>()),
  generateText: vi.fn(),
}));
vi.mock('../src/util/model', () => ({ languageModel: vi.fn() }));

const data = [{ value: 2 }, { value: 4 }];
let ava: AVA;

beforeEach(async () => {
  vi.resetAllMocks();
  ava = new AVA({ llm: { model: 'test' }, engine: { type: 'javascript' } });
  await ava.source({ type: 'json', options: { data } });
});

afterEach(async () => {
  await ava?.dispose();
});

function abortController(): { controller: AbortController; reason: Error } {
  const reason = new Error('Client disconnected');
  const controller = new AbortController();
  controller.abort(reason);
  return { controller, reason };
}

describe('cancellation', () => {
  it('refuses to start any command once the signal is aborted', async () => {
    const { controller, reason } = abortController();

    await expect(ava.analyze('Total value', {}, controller.signal)).rejects.toBe(reason);
    await expect(ava.translate('Total value', controller.signal)).rejects.toBe(reason);
    await expect(ava.query('const result = data;', undefined, controller.signal)).rejects.toBe(reason);
    await expect(ava.suggest(1, controller.signal)).rejects.toBe(reason);
    await expect(ava.recommend({ query: 'Total value', data }, controller.signal)).rejects.toBe(reason);
    await expect(ava.visualize({ query: 'Total value', data }, controller.signal)).rejects.toBe(reason);

    expect(generateText).not.toHaveBeenCalled();
  });

  it('reports an AbortError when the signal carries no reason', async () => {
    const controller = new AbortController();
    controller.abort();

    const error = await ava.query('const result = data;', undefined, controller.signal).catch((reason) => reason);

    expect(error).toBeInstanceOf(DOMException);
    expect(error.name).toBe('AbortError');
  });

  it('forwards the signal to the dialect model call', async () => {
    vi.mocked(generateText).mockResolvedValue({ text: 'const result = data;', finishReason: 'stop' } as never);
    const getDSL = vi.spyOn(ava.engine!, 'getDSL');
    const controller = new AbortController();

    await expect(ava.translate('Rows', controller.signal)).resolves.toBe('const result = data;');

    expect(getDSL).toHaveBeenLastCalledWith('Rows', expect.anything(), controller.signal);
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({ abortSignal: controller.signal }));
  });

  it('does not cache schema returned by an engine after cancellation', async () => {
    const controller = new AbortController();
    const reason = new Error('Client disconnected');
    const model = { models: [], relationships: [] };
    const schema = vi.spyOn(ava.engine!, 'schema').mockImplementationOnce(async () => {
      controller.abort(reason);
      return model;
    });

    await expect(ava.translate('Rows', controller.signal)).rejects.toBe(reason);
    expect(schema).toHaveBeenCalledExactlyOnceWith(controller.signal);
    expect(generateText).not.toHaveBeenCalled();

    expect((await ava.schema()).models).toHaveLength(1);
    expect(schema).toHaveBeenLastCalledWith();
  });

  it('forwards the signal to query execution', async () => {
    const execute = vi.spyOn(ava.engine!, 'execute');
    const controller = new AbortController();

    await ava.query('const result = data;', undefined, controller.signal);

    expect(execute).toHaveBeenCalledWith('const result = data;', undefined, controller.signal);
  });

  it('forwards the signal through analysis translation and execution', async () => {
    const getDSL = vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue({ dsl: 'const result = data;' });
    const execute = vi.spyOn(ava.engine!, 'execute');
    const controller = new AbortController();

    await ava.analyze('Total value', { includeSummary: false, strategy: { type: 'direct', maxRetries: 0 } }, controller.signal);

    expect(getDSL).toHaveBeenLastCalledWith('Total value', expect.anything(), controller.signal);
    expect(execute).toHaveBeenLastCalledWith(expect.any(String), expect.anything(), controller.signal);
  });

  it('keeps the original call shape when no signal is supplied', async () => {
    const getDSL = vi.spyOn(ava.engine!, 'getDSL').mockResolvedValue({ dsl: 'const result = data;' });
    const execute = vi.spyOn(ava.engine!, 'execute');

    await ava.translate('Rows');
    expect(getDSL).toHaveBeenLastCalledWith('Rows', expect.anything());

    await ava.query('const result = data;');
    expect(execute).toHaveBeenCalledWith('const result = data;', undefined);
  });
});
