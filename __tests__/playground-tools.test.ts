import { describe, expect, it, vi } from 'vitest';
import type { AVA } from '@antv/ava/browser';
import { createTools } from '../site/ai/core/tools';

describe('Playground analyze and chart', () => {
  const options = { toolCallId: 'analysis', messages: [] };
  const first = { query: 'channels', sql: 'return channels', data: [{ channel: 'A', sales: 5 }] };
  const second = { query: 'categories', sql: 'return categories', data: [{ category: 'B', sales: 3 }] };
  const chart = { chartType: 'bar', config: { type: 'bar', data: first.data }, html: '<html>chart</html>' };

  it('binds each chart to its own executed query and exposes no standalone visualization tool', async () => {
    const analyze = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const visualize = vi.fn().mockResolvedValueOnce(chart).mockResolvedValueOnce(null);
    const tools = createTools({ ava: { analyze, visualize } as unknown as AVA, dataset: { name: 'test', rows: [] } });
    expect(tools).not.toHaveProperty('visualize');
    const one = await tools.analyze.execute!({ query: 'channels' }, options);
    const two = await tools.analyze.execute!({ query: 'categories' }, options);
    expect(visualize.mock.calls.map(([result]) => result)).toEqual([first, second]);
    expect(one).toMatchObject({ ...first, visualization: chart });
    expect(one).toHaveProperty('resultId', 'R1');
    expect(two).toHaveProperty('resultId', 'R2');
    expect(two).toMatchObject({ ...second, visualization: null });
    const modelOutput = await tools.analyze.toModelOutput!({
      output: one,
      input: { query: 'channels' },
      toolCallId: 'analysis',
    });
    expect(modelOutput).toMatchObject({ type: 'text' });
    const value = JSON.parse((modelOutput as { value: string }).value);
    expect(value).toMatchObject({ data: first.data, visualization: { config: chart.config } });
    expect(value.visualization).not.toHaveProperty('html');
  });

  it('preserves a successful query when chart generation fails, but propagates query failures', async () => {
    const analyze = vi.fn().mockResolvedValueOnce(first).mockRejectedValueOnce(new Error('query failed'));
    const visualize = vi.fn().mockRejectedValue(new Error('chart failed'));
    const tools = createTools({ ava: { analyze, visualize } as unknown as AVA, dataset: { name: 'test', rows: [] } });
    await expect(tools.analyze.execute!({ query: 'channels' }, options)).resolves.toMatchObject({
      ...first,
      visualization: null,
      visualizationError: 'chart failed',
    });
    await expect(tools.analyze.execute!({ query: 'categories' }, options)).rejects.toThrow('query failed');
    expect(visualize).toHaveBeenCalledTimes(2);
  });

  it('retries a failed chart against the same result without rerunning the query, and retains the failure record', async () => {
    const analyze = vi.fn().mockResolvedValue(first);
    const visualize = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce(chart);
    const tools = createTools({ ava: { analyze, visualize } as unknown as AVA, dataset: { name: 'test', rows: [] } });
    await expect(tools.analyze.execute!({ query: 'channels' }, options)).resolves.toMatchObject({
      ...first,
      visualization: chart,
      visualizationError: undefined,
      visualizationAttempts: 2,
      visualizationWarnings: ['temporary network failure'],
    });
    expect(analyze).toHaveBeenCalledOnce();
    expect(analyze.mock.calls[0][0]).toContain('channels');
    expect(analyze.mock.calls[0][0]).toContain('Return a flat array of records');
    expect(visualize.mock.calls.map(([result]) => result)).toEqual([first, first]);
  });
});
