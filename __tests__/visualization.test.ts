import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { AVA } from '../src/ava';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../src/util/model', () => ({ languageModel: vi.fn() }));

const result = {
  query: 'Compare revenue by city as a chart',
  text: '',
  schema: [{ name: 'city' }, { name: 'revenue' }],
  data: [{ city: 'Hangzhou', revenue: 100 }],
};
const config = { type: 'column', data: [{ category: 'Hangzhou', value: 100 }] };
const json = JSON.stringify(config);
const ava = new AVA({ llm: { model: 'test' } });

beforeEach(() => vi.resetAllMocks());

const usage = { inputTokens: 10, outputTokens: 5, totalTokens: 15 };

function reply(text: string) {
  vi.mocked(generateText).mockResolvedValueOnce({ text, usage } as never);
}

describe('chart recommendation', () => {
  it('generates a chart specification without rendering HTML', async () => {
    reply('column');
    reply(`\`\`\`json\n${json}\n\`\`\``);
    expect(await ava['recommend'](result)).toEqual({ chartType: 'column', config });
    expect(generateText).toHaveBeenCalledTimes(2);
    const prompt = vi.mocked(generateText).mock.calls[0][0].prompt;
    expect(prompt).toContain(result.query);
    expect(prompt).toContain('# Data Model');
    expect(prompt).toContain('- city (string)');
    expect(prompt).toContain('- revenue (number)');
    expect(vi.mocked(generateText).mock.calls[1][0].prompt).toContain('Hangzhou');
  });

  it('skips empty data without calling the model', async () => {
    expect(await ava['recommend']({ ...result, data: [] })).toBeNull();
    expect(generateText).not.toHaveBeenCalled();
  });

  it('skips null data without duplicating events', async () => {
    const listener = vi.fn();
    ava.on('visualizeend', listener);
    await expect(ava.visualize({ query: result.query, data: null as never })).resolves.toBeNull();
    ava.off('visualizeend', listener);
    expect(listener).toHaveBeenCalledOnce();
    expect(generateText).not.toHaveBeenCalled();
  });

  it.each(['none', 'invalid-chart'])('skips config generation for %s', async (chartType) => {
    reply(chartType);
    expect(await ava['recommend'](result)).toBeNull();
    expect(generateText).toHaveBeenCalledOnce();
  });

  it('propagates recommendation errors', async () => {
    vi.mocked(generateText).mockRejectedValueOnce(new Error('Model unavailable'));
    await expect(ava['recommend'](result)).rejects.toThrow('Model unavailable');
  });

  it('renders the recommended specification through visualize', async () => {
    const onEvent = vi.fn();
    ava.on('visualizestart', onEvent);
    ava.on('visualizeend', onEvent);
    reply('column');
    reply(json);
    const visualization = await ava.visualize(result);
    ava.off('visualizestart', onEvent);
    ava.off('visualizeend', onEvent);
    expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
      { type: 'visualizestart', data: { query: result.query } },
      { type: 'visualizeend', data: { usages: [usage, usage] } },
    ]);
    expect(visualization).toMatchObject({ chartType: 'column', config });
    expect(visualization?.html).toContain('<!DOCTYPE html>');
    expect(visualization?.html).toContain(json);
    expect(generateText).toHaveBeenCalledTimes(2);
  });

  it('uses an overridden recommend method when visualizing', async () => {
    const instance = new AVA({ llm: { model: 'test' } });
    const recommend = vi.spyOn(instance, 'recommend').mockResolvedValue({ chartType: 'column', config });
    const listener = vi.fn();
    instance.on('visualizeend', listener);
    expect(await instance.visualize(result)).toMatchObject({ chartType: 'column', config });
    expect(recommend).toHaveBeenCalledOnce();
    expect(generateText).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ data: {} }));
  });

  it('preserves one event pair and usage when an override delegates to super', async () => {
    class CustomAVA extends AVA {
      async recommend(input: Parameters<AVA['recommend']>[0]) {
        return super.recommend({ ...input });
      }
    }
    const instance = new CustomAVA({ llm: { model: 'test' } });
    const events: Array<{ type: string; data: unknown }> = [];
    instance.on('visualizestart', (event) => events.push(event));
    instance.on('visualizeend', (event) => events.push(event));
    reply('column');
    reply(json);
    await instance.visualize(result);
    expect(events).toEqual([
      { type: 'visualizestart', data: { query: result.query } },
      { type: 'visualizeend', data: { usages: [usage, usage] } },
    ]);
  });

  it('preserves events and usage when an override rebuilds the public input', async () => {
    class CustomAVA extends AVA {
      async recommend(input: Parameters<AVA['recommend']>[0]) {
        return super.recommend({ query: input.query, data: input.data });
      }
    }
    const instance = new CustomAVA({ llm: { model: 'test' } });
    const events: Array<{ type: string; data: unknown }> = [];
    instance.on('visualizestart', (event) => events.push(event));
    instance.on('visualizeend', (event) => events.push(event));
    reply('column');
    reply(json);
    await instance.visualize(result);
    expect(events).toEqual([
      { type: 'visualizestart', data: { query: result.query } },
      { type: 'visualizeend', data: { usages: [usage, usage] } },
    ]);
  });

  it('reports failed rebuilt recommendations once with their usage', async () => {
    class CustomAVA extends AVA {
      async recommend(input: Parameters<AVA['recommend']>[0]) {
        return super.recommend({ query: input.query, data: input.data });
      }
    }
    const instance = new CustomAVA({ llm: { model: 'test' } });
    const listener = vi.fn();
    instance.on('visualizeend', listener);
    reply('column');
    reply('invalid json');
    await expect(instance.visualize(result)).rejects.toThrow();
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ usages: [usage, usage], error: expect.any(Object) }) }));
  });

  it('reports one failed event with partial usage when a delegated recommendation fails', async () => {
    class CustomAVA extends AVA {
      async recommend(input: Parameters<AVA['recommend']>[0]) { return super.recommend(input); }
    }
    const instance = new CustomAVA({ llm: { model: 'test' } });
    const listener = vi.fn();
    instance.on('visualizeend', listener);
    reply('column');
    reply('invalid json');
    await expect(instance.visualize(result)).rejects.toThrow();
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ usages: [usage, usage], error: expect.any(Object) }) }));
  });

  it('treats a saved delegated input as standalone after visualization ends', async () => {
    let saved: Parameters<AVA['recommend']>[0] | undefined;
    class CustomAVA extends AVA {
      async recommend(input: Parameters<AVA['recommend']>[0]) {
        saved = input;
        return super.recommend(input);
      }
    }
    const instance = new CustomAVA({ llm: { model: 'test' } });
    const end = vi.fn();
    instance.on('visualizeend', end);
    reply('none');
    await instance.visualize(result);
    reply('none');
    await instance.recommend(saved!);
    expect(end).toHaveBeenCalledTimes(2);
    expect(end.mock.calls[1][0].data.usages).toEqual([usage]);
  });

  it('emits events as well as reporting usage for direct recommendation', async () => {
    const listener = vi.fn();
    const reportUsage = vi.fn();
    ava.on('visualizestart', listener);
    ava.on('visualizeend', listener);
    reply('column');
    reply(json);
    await ava.recommend(result, reportUsage);
    ava.off('visualizestart', listener);
    ava.off('visualizeend', listener);
    expect(reportUsage).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls.map(([event]) => event)).toEqual([
      { type: 'visualizestart', data: { query: result.query } },
      { type: 'visualizeend', data: { usages: [usage, usage] } },
    ]);
  });

  it('keeps concurrent visualizations of the same input independent', async () => {
    class CustomAVA extends AVA {
      async recommend(input: Parameters<AVA['recommend']>[0]) {
        await Promise.resolve();
        return super.recommend({ query: input.query, data: input.data });
      }
    }
    const instance = new CustomAVA({ llm: { model: 'test' } });
    const ends: Array<{ data: { usages: unknown[] } }> = [];
    instance.on('visualizeend', (event) => ends.push(event));
    const otherUsage = { inputTokens: 20, outputTokens: 10, totalTokens: 30 };
    reply('none');
    vi.mocked(generateText).mockResolvedValueOnce({ text: 'none', usage: otherUsage } as never);
    await Promise.all([instance.visualize(result), instance.visualize(result)]);
    expect(ends).toHaveLength(2);
    expect(ends.map(({ data }) => data.usages)).toEqual([[usage], [otherUsage]]);
  });

  it.each(['recommend', 'visualize'] as const)('reports both model calls when %s config parsing fails', async (method) => {
    const listener = vi.fn();
    ava.on('visualizeend', listener);
    reply('column');
    reply('invalid json');
    await expect(ava[method](result)).rejects.toThrow();
    ava.off('visualizeend', listener);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ usages: [usage, usage], error: expect.any(Object) }) }));
  });

  it('reports recommendation usage even when no chart is needed', async () => {
    const listener = vi.fn();
    ava.on('visualizeend', listener);
    reply('none');
    await ava.recommend(result);
    ava.off('visualizeend', listener);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ data: { usages: [usage] } }));
  });

  it('renders a supplied specification deterministically without calling the model', async () => {
    const spec = { chartType: 'column' as const, config };
    const html = await ava['viz'](spec);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain(json);
    expect(html).toContain('gptVis.render(visConfig)');
    expect(await ava['viz'](spec)).toBe(html);
    expect(generateText).not.toHaveBeenCalled();
  });
});
