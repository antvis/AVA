import type { LanguageModelUsage } from 'ai';

/** Sum reported counts only when every call provides them. */
export function addUsage(previous: LanguageModelUsage | undefined, next: LanguageModelUsage): LanguageModelUsage {
  if (!previous) return next;
  const sum = (a: number | undefined, b: number | undefined) =>
    a === undefined || b === undefined ? undefined : a + b;
  return {
    inputTokens: sum(previous.inputTokens, next.inputTokens),
    outputTokens: sum(previous.outputTokens, next.outputTokens),
    totalTokens: sum(previous.totalTokens, next.totalTokens),
    inputTokenDetails: {
      noCacheTokens: sum(previous.inputTokenDetails?.noCacheTokens, next.inputTokenDetails?.noCacheTokens),
      cacheReadTokens: sum(previous.inputTokenDetails?.cacheReadTokens, next.inputTokenDetails?.cacheReadTokens),
      cacheWriteTokens: sum(previous.inputTokenDetails?.cacheWriteTokens, next.inputTokenDetails?.cacheWriteTokens),
    },
    outputTokenDetails: {
      textTokens: sum(previous.outputTokenDetails?.textTokens, next.outputTokenDetails?.textTokens),
      reasoningTokens: sum(previous.outputTokenDetails?.reasoningTokens, next.outputTokenDetails?.reasoningTokens),
    },
  };
}
