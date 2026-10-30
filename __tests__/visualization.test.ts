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
const usage = { inputTokens: 10, outputTokens: 5, totalTokens: 15 };
const ava = new AVA({ llm: { model: 'test' } });

beforeEach(() => vi.resetAllMocks());

function reply(text: string, tokens = usage) {
  vi.mocked(generateText).mockResolvedValueOnce({ text, usage: tokens } as never);
}

function listen(instance: AVA) {
  const events: Array<{ type: string; data: any }> = [];
  for (const name of ['recommendstart', 'recommendend', 'visualizestart', 'visualizeend']) {
    instance.on(name, (event) => events.push(event));
  }
  return events;
}

describe('chart recommendation', () => {
  it('returns a specification and reports each model call', async () => {
    const instance = new AVA({ llm: { model: 'test' } });
    const events = listen(instance);
    reply('column');
    reply(`\`\`\`json\n${json}\n\`\`\``);
    expect(await instance.recommend(result)).toEqual({ chartType: 'column', config });
    expect(events).toEqual([
      { type: 'recommendstart', data: { query: result.query } },
      { type: 'recommendend', data: { usages: [usage, usage] } },
    ]);
    const prompt = vi.mocked(generateText).mock.calls[0][0].prompt;
    expect(prompt).toContain(result.query);
    expect(prompt).toContain('# Data Model');
    expect(prompt).toContain('- city (string)');
    expect(vi.mocked(generateText).mock.calls[1][0].prompt).toContain('Hangzhou');
  });

  it('skips empty data without calling the model', async () => {
    expect(await ava.recommend({ ...result, data: [] })).toBeNull();
    expect(generateText).not.toHaveBeenCalled();
  });

  it.each(['none', 'invalid-chart'])('skips config generation for %s', async (chartType) => {
    reply(chartType);
    expect(await ava.recommend(result)).toBeNull();
    expect(generateText).toHaveBeenCalledOnce();
  });

  it('emits one event pair per operation when visualizing', async () => {
    const instance = new AVA({ llm: { model: 'test' } });
    const events = listen(instance);
    reply('column');
    reply(json);
    const visualization = await instance.visualize(result);
    expect(events).toEqual([
      { type: 'visualizestart', data: { query: result.query } },
      { type: 'recommendstart', data: { query: result.query } },
      { type: 'recommendend', data: { usages: [usage, usage] } },
      { type: 'visualizeend', data: {} },
    ]);
    expect(visualization).toMatchObject({ chartType: 'column', config });
    expect(visualization?.html).toContain(json);
  });

  it('uses an overridden recommendation method without copying input', async () => {
    const instance = new AVA({ llm: { model: 'test' } });
    const recommend = vi.spyOn(instance, 'recommend').mockResolvedValue({ chartType: 'column', config });
    expect(await instance.visualize(result)).toMatchObject({ chartType: 'column', config });
    expect(recommend).toHaveBeenCalledExactlyOnceWith(result);
    expect(generateText).not.toHaveBeenCalled();
  });

  it('handles overrides that rebuild the input before calling super', async () => {
    class CustomAVA extends AVA {
      async recommend(input: Parameters<AVA['recommend']>[0]) {
        return super.recommend({ query: input.query, data: [...input.data] });
      }
    }
    const instance = new CustomAVA({ llm: { model: 'test' } });
    const events = listen(instance);
    reply('column');
    reply(json);
    await instance.visualize(result);
    expect(events.map(({ type }) => type)).toEqual([
      'visualizestart', 'recommendstart', 'recommendend', 'visualizeend',
    ]);
    expect(events[2].data.usages).toEqual([usage, usage]);
  });

  it('keeps concurrent recommendations independent', async () => {
    const instance = new AVA({ llm: { model: 'test' } });
    const events = listen(instance);
    const otherUsage = { inputTokens: 20, outputTokens: 10, totalTokens: 30 };
    reply('none');
    reply('none', otherUsage);
    await Promise.all([instance.visualize(result), instance.visualize(result)]);
    expect(events.filter(({ type }) => type === 'recommendend').map(({ data }) => data.usages)).toEqual([
      [usage], [otherUsage],
    ]);
  });

  it('reports a model failure without usage', async () => {
    const instance = new AVA({ llm: { model: 'test' } });
    const events = listen(instance);
    vi.mocked(generateText).mockRejectedValueOnce(new Error('Model unavailable'));
    await expect(instance.recommend(result)).rejects.toThrow('Model unavailable');
    expect(events).toEqual([
      { type: 'recommendstart', data: { query: result.query } },
      { type: 'recommendend', data: { error: { name: 'Error', message: 'Model unavailable' } } },
    ]);
  });

  it('reports usage and errors on recommendation failure', async () => {
    const instance = new AVA({ llm: { model: 'test' } });
    const events = listen(instance);
    reply('column');
    reply('invalid json');
    await expect(instance.visualize(result)).rejects.toThrow();
    expect(events.map(({ type }) => type)).toEqual([
      'visualizestart', 'recommendstart', 'recommendend', 'visualizeend',
    ]);
    expect(events[2].data).toMatchObject({ usages: [usage, usage], error: expect.any(Object) });
    expect(events[3].data.error).toBeDefined();
  });

  it('reports visualization errors after a successful recommendation', async () => {
    const instance = new AVA({ llm: { model: 'test' } });
    const events = listen(instance);
    reply('column');
    reply(json);
    vi.spyOn(instance, 'viz').mockRejectedValue(new Error('render failed'));
    await expect(instance.visualize(result)).rejects.toThrow('render failed');
    expect(events[2]).toMatchObject({ type: 'recommendend', data: { usages: [usage, usage] } });
    expect(events[3]).toMatchObject({ type: 'visualizeend', data: { error: { message: 'render failed' } } });
  });

  it('renders a supplied specification without calling the model', async () => {
    const spec = { chartType: 'column' as const, config };
    const html = await ava.viz(spec);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain(json);
    expect(html).toContain('gptVis.render(visConfig)');
    expect(generateText).not.toHaveBeenCalled();
  });
});
