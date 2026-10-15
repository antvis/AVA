import type { LanguageModelUsage } from 'ai';
import type { LLMConfig, RunContext } from '../types';

type TokenDetails = {
  noCacheTokens: number | undefined;
  cacheReadTokens: number | undefined;
  cacheWriteTokens: number | undefined;
};

type OutputTokenDetails = {
  textTokens: number | undefined;
  reasoningTokens: number | undefined;
};

function addTokenCount(current: number | undefined, next: number | undefined): number | undefined {
  if (next === undefined || !Number.isFinite(next)) return current;
  return current === undefined ? next : current + next;
}

function hasKnownUsage(usage: LanguageModelUsage): boolean {
  return [
    usage.inputTokens,
    usage.inputTokenDetails?.noCacheTokens,
    usage.inputTokenDetails?.cacheReadTokens,
    usage.inputTokenDetails?.cacheWriteTokens,
    usage.outputTokens,
    usage.outputTokenDetails?.textTokens,
    usage.outputTokenDetails?.reasoningTokens,
    usage.totalTokens,
  ].some((value) => typeof value === 'number' && Number.isFinite(value));
}

let runSequence = 0;
let callSequence = 0;

export class UsageCollector {
  private readonly completedCalls = new Set<string>();
  private readonly pendingCalls = new Set<string>();
  private inputTokens: number | undefined;
  private noCacheTokens: number | undefined;
  private cacheReadTokens: number | undefined;
  private cacheWriteTokens: number | undefined;
  private outputTokens: number | undefined;
  private textTokens: number | undefined;
  private reasoningTokens: number | undefined;
  private totalTokens: number | undefined;

  constructor(private readonly parent?: UsageCollector) {}

  get hasUnknownUsage(): boolean {
    return this.pendingCalls.size > 0;
  }

  markUnknown(callId: string): void {
    if (this.completedCalls.has(callId) || this.pendingCalls.has(callId)) return;
    this.pendingCalls.add(callId);
    this.parent?.markUnknown(callId);
  }

  add(callId: string, usage: LanguageModelUsage): void {
    if (this.completedCalls.has(callId) || !hasKnownUsage(usage)) return;
    this.pendingCalls.delete(callId);
    this.completedCalls.add(callId);

    this.inputTokens = addTokenCount(this.inputTokens, usage.inputTokens);
    this.noCacheTokens = addTokenCount(this.noCacheTokens, usage.inputTokenDetails?.noCacheTokens);
    this.cacheReadTokens = addTokenCount(this.cacheReadTokens, usage.inputTokenDetails?.cacheReadTokens);
    this.cacheWriteTokens = addTokenCount(this.cacheWriteTokens, usage.inputTokenDetails?.cacheWriteTokens);
    this.outputTokens = addTokenCount(this.outputTokens, usage.outputTokens);
    this.textTokens = addTokenCount(this.textTokens, usage.outputTokenDetails?.textTokens);
    this.reasoningTokens = addTokenCount(this.reasoningTokens, usage.outputTokenDetails?.reasoningTokens);
    this.totalTokens = addTokenCount(this.totalTokens, usage.totalTokens);
    this.parent?.add(callId, usage);
  }

  getUsage(): LanguageModelUsage | undefined {
    if (
      this.inputTokens === undefined &&
      this.noCacheTokens === undefined &&
      this.cacheReadTokens === undefined &&
      this.cacheWriteTokens === undefined &&
      this.outputTokens === undefined &&
      this.textTokens === undefined &&
      this.reasoningTokens === undefined &&
      this.totalTokens === undefined
    ) {
      return undefined;
    }

    const inputTokenDetails: TokenDetails = {
      noCacheTokens: this.noCacheTokens,
      cacheReadTokens: this.cacheReadTokens,
      cacheWriteTokens: this.cacheWriteTokens,
    };
    const outputTokenDetails: OutputTokenDetails = {
      textTokens: this.textTokens,
      reasoningTokens: this.reasoningTokens,
    };

    return {
      inputTokens: this.inputTokens,
      inputTokenDetails,
      outputTokens: this.outputTokens,
      outputTokenDetails,
      totalTokens: this.totalTokens,
    };
  }
}

export function createRunContext(parent?: RunContext): RunContext {
  return {
    runId: parent?.runId ?? `ava-${++runSequence}`,
    usage: new UsageCollector(parent?.usage),
  };
}

export function withUsageCollector<T extends LLMConfig>(llm: T, usage: UsageCollector): T {
  return { ...llm, usageCollector: usage } as T;
}

export function languageModelUsage(usage: {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}): LanguageModelUsage {
  return {
    inputTokens: usage.inputTokens,
    inputTokenDetails: {
      noCacheTokens: undefined,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
    },
    outputTokens: usage.outputTokens,
    outputTokenDetails: {
      textTokens: undefined,
      reasoningTokens: undefined,
    },
    totalTokens: usage.totalTokens,
  };
}

export function getUsageCollector(llm: LLMConfig): UsageCollector | undefined {
  return (llm as LLMConfig & { usageCollector?: UsageCollector }).usageCollector;
}

export function beginModelCall(usage?: UsageCollector): (tokenUsage?: LanguageModelUsage) => void {
  if (!usage) return () => undefined;
  const callId = `ava-call-${++callSequence}`;
  usage.markUnknown(callId);
  return (tokenUsage) => {
    if (tokenUsage) usage.add(callId, tokenUsage);
  };
}

type UsageAwareOptions = {
  [key: string]: unknown;
  onEnd?: (event: { totalUsage?: LanguageModelUsage; usage?: LanguageModelUsage }) => unknown;
  onFinish?: (event: { totalUsage?: LanguageModelUsage; usage?: LanguageModelUsage }) => unknown;
};

export function withModelUsage<T extends UsageAwareOptions>(options: T, llm: LLMConfig): T {
  const usage = getUsageCollector(llm);
  if (!usage) return options;

  const recordUsage = beginModelCall(usage);
  const onEnd = options.onEnd ?? options.onFinish;

  return {
    ...options,
    onEnd: (event) => {
      const totalUsage = event.totalUsage ?? event.usage;
      if (totalUsage) recordUsage(totalUsage);
      return onEnd?.(event);
    },
  } as T;
}
