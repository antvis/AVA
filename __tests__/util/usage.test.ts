import { describe, expect, it, vi } from 'vitest';

import { createRunContext, UsageCollector, withModelUsage, withUsageCollector } from '../../src/util/usage';

import type { LanguageModelUsage } from 'ai';

function usage(values: Partial<LanguageModelUsage> = {}): LanguageModelUsage {
  return {
    inputTokens: undefined,
    inputTokenDetails: {
      noCacheTokens: undefined,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
    },
    outputTokens: undefined,
    outputTokenDetails: {
      textTokens: undefined,
      reasoningTokens: undefined,
    },
    totalTokens: undefined,
    ...values,
  };
}

describe('UsageCollector', () => {
  it('deduplicates calls and aggregates known fields without deriving missing totals', () => {
    const collector = new UsageCollector();
    const first = usage({
      inputTokens: 10,
      inputTokenDetails: { noCacheTokens: 8, cacheReadTokens: 2, cacheWriteTokens: undefined },
      outputTokens: 5,
      outputTokenDetails: { textTokens: 3, reasoningTokens: 2 },
    });
    collector.add('first', first);
    collector.add('first', first);
    collector.add('second', usage({ inputTokens: 7, totalTokens: 9 }));

    expect(collector.getUsage()).toEqual(
      usage({
        inputTokens: 17,
        inputTokenDetails: { noCacheTokens: 8, cacheReadTokens: 2, cacheWriteTokens: undefined },
        outputTokens: 5,
        outputTokenDetails: { textTokens: 3, reasoningTokens: 2 },
        totalTokens: 9,
      })
    );
  });

  it('keeps unknown calls pending and returns undefined when no usage is known', () => {
    const collector = new UsageCollector();
    collector.markUnknown('failed');
    collector.add('unknown', usage());

    expect(collector.getUsage()).toBeUndefined();
    expect(collector.hasUnknownUsage).toBe(true);
  });

  it('aggregates nested scopes into the parent without mixing child results', () => {
    const run = createRunContext();
    const firstChild = createRunContext(run);
    const secondChild = createRunContext(run);
    const firstUsage = usage({ inputTokens: 3, totalTokens: 4 });
    const secondUsage = usage({ outputTokens: 5, totalTokens: 5 });

    firstChild.usage.add('first', firstUsage);
    secondChild.usage.add('second', secondUsage);

    expect(firstChild.runId).toBe(run.runId);
    expect(firstChild.usage.getUsage()).toEqual(firstUsage);
    expect(secondChild.usage.getUsage()).toEqual(secondUsage);
    expect(run.usage.getUsage()).toEqual(
      usage({
        inputTokens: 3,
        outputTokens: 5,
        totalTokens: 9,
      })
    );
  });
});

describe('AI SDK usage callbacks', () => {
  it('collects totalUsage once and preserves an existing onFinish callback', () => {
    const collector = new UsageCollector();
    const llm = withUsageCollector({ model: 'test' }, collector);
    const onFinish = vi.fn();
    const options = withModelUsage({ prompt: 'test', onFinish }, llm) as {
      onEnd: (event: { totalUsage: LanguageModelUsage; usage: LanguageModelUsage }) => void;
    };
    const totalUsage = usage({ inputTokens: 20, outputTokens: 10, totalTokens: 30 });

    expect(collector.hasUnknownUsage).toBe(true);
    options.onEnd({ totalUsage, usage: usage({ totalTokens: 2 }) });

    expect(collector.getUsage()).toEqual(totalUsage);
    expect(collector.hasUnknownUsage).toBe(false);
    expect(onFinish).toHaveBeenCalledOnce();
    expect(onFinish).toHaveBeenCalledWith({ totalUsage, usage: usage({ totalTokens: 2 }) });
  });

  it('waits for stream completion and leaves aborted or usage-less calls unknown', () => {
    const completedCollector = new UsageCollector();
    const completed = withModelUsage(
      { prompt: 'stream', onFinish: vi.fn() },
      withUsageCollector({ model: 'test' }, completedCollector)
    ) as { onEnd: (event: { totalUsage: LanguageModelUsage }) => void };

    expect(completedCollector.getUsage()).toBeUndefined();
    expect(completedCollector.hasUnknownUsage).toBe(true);
    completed.onEnd({ totalUsage: usage({ outputTokens: 6, totalTokens: 6 }) });
    expect(completedCollector.getUsage()?.totalTokens).toBe(6);
    expect(completedCollector.hasUnknownUsage).toBe(false);

    const abortedCollector = new UsageCollector();
    withModelUsage({ prompt: 'aborted' }, withUsageCollector({ model: 'test' }, abortedCollector));
    expect(abortedCollector.getUsage()).toBeUndefined();
    expect(abortedCollector.hasUnknownUsage).toBe(true);

    const unknownCollector = new UsageCollector();
    const unknown = withModelUsage(
      { prompt: 'no usage' },
      withUsageCollector({ model: 'test' }, unknownCollector)
    ) as { onEnd: (event: { totalUsage: LanguageModelUsage }) => void };
    unknown.onEnd({ totalUsage: usage() });
    expect(unknownCollector.getUsage()).toBeUndefined();
    expect(unknownCollector.hasUnknownUsage).toBe(true);
  });
});
