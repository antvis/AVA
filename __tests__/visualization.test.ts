import { runInNewContext } from 'node:vm';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { dependencies, devDependencies } from '../package.json';
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

function reply(text: string) {
  vi.mocked(generateText).mockResolvedValueOnce({ text } as never);
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
    expect(vi.mocked(generateText).mock.calls[1][0].prompt).toContain('"category"');
  });

  it('skips empty data without calling the model', async () => {
    expect(await ava['recommend']({ ...result, data: [] })).toBeNull();
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
      { type: 'visualizeend', data: {} },
    ]);
    expect(visualization).toMatchObject({ chartType: 'column', config });
    expect(visualization?.html).toContain('<!DOCTYPE html>');
    expect(
      runInNewContext(`(${visualization!.html.match(/const visConfig = (.+);/)![1]})`, {}, { timeout: 1000 })
    ).toEqual(config);
    expect(generateText).toHaveBeenCalledTimes(2);
    expect(await ava.viz(visualization!)).toBe(visualization!.html);
    expect(await ava.viz({ ...visualization!, html: 'stale HTML' })).toBe(visualization!.html);
    expect(generateText).toHaveBeenCalledTimes(2);
  });

  it('renders a supplied specification deterministically without calling the model', async () => {
    const spec = { chartType: 'column' as const, config };
    const html = await ava['viz'](spec);
    expect(html).toContain('<!DOCTYPE html>');
    expect(runInNewContext(`(${html.match(/const visConfig = (.+);/)![1]})`, {}, { timeout: 1000 })).toEqual(config);
    expect(html).toContain('gptVis.render(visConfig)');
    expect(dependencies).not.toHaveProperty('@antv/gpt-vis');
    expect(await ava['viz'](spec)).toBe(html);
    const title = '</script><script>throw new Error("injected")</script>\u2028\u2029';
    const escaped = await ava.viz({ chartType: 'column', config: { ...config, type: 'column', title } });
    expect(escaped).not.toContain('</script><script>');
    expect(runInNewContext(`(${escaped.match(/const visConfig = (.+);/)![1]})`, {}, { timeout: 1000 }).title).toBe(
      title
    );
    expect(generateText).not.toHaveBeenCalled();
  });
});
