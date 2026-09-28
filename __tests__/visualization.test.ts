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
const syntax = 'vis column\ndata\n  - Hangzhou 100';
const ava = new AVA({ llm: { model: 'test' } });

beforeEach(() => vi.resetAllMocks());

function reply(text: string) {
  vi.mocked(generateText).mockResolvedValueOnce({ text } as never);
}

describe('chart recommendation', () => {
  it('generates a chart specification without rendering HTML', async () => {
    reply('column');
    reply(`\`\`\`vis\n${syntax}\n\`\`\``);
    expect(await ava['recommend'](result)).toEqual({ chartType: 'column', syntax });
    expect(generateText).toHaveBeenCalledTimes(2);
    expect(vi.mocked(generateText).mock.calls[0][0].prompt).toContain(result.query);
    expect(vi.mocked(generateText).mock.calls[1][0].prompt).toContain('Hangzhou');
  });

  it('skips empty data without calling the model', async () => {
    expect(await ava['recommend']({ ...result, data: [] })).toBeNull();
    expect(generateText).not.toHaveBeenCalled();
  });

  it('skips syntax generation for none', async () => {
    const chartType = 'none';
    reply(chartType);
    expect(await ava['recommend'](result)).toBeNull();
    expect(generateText).toHaveBeenCalledOnce();
  });

  it('propagates recommendation errors', async () => {
    vi.mocked(generateText).mockRejectedValueOnce(new Error('Model unavailable'));
    await expect(ava['recommend'](result)).rejects.toThrow('Model unavailable');
  });

  it('renders the recommended specification through visualize', async () => {
    reply('column');
    reply(syntax);
    const visualization = await ava.visualize(result);
    expect(visualization).toMatchObject({ chartType: 'column', syntax });
    expect(visualization?.html).toContain('<!DOCTYPE html>');
    expect(visualization?.html).toContain(syntax);
    expect(generateText).toHaveBeenCalledTimes(2);
  });

  it('renders a supplied specification deterministically without calling the model', async () => {
    const spec = { chartType: 'column' as const, syntax };
    const html = await ava['viz'](spec);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain(syntax);
    expect(html).toContain('gptVis.render(visSyntax)');
    expect(await ava['viz'](spec)).toBe(html);
    expect(generateText).not.toHaveBeenCalled();
  });
});
