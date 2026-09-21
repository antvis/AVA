export type AVAErrorCode =
  /** Query execution exceeded its time limit; callers may retry or raise the timeout. */
  | 'QUERY_TIMEOUT'
  /** The execution engine exhausted a bounded resource such as memory or temporary disk space. */
  | 'RESOURCE_LIMIT_EXCEEDED'
  /** A result value is too large to return safely; callers should request less or smaller data. */
  | 'RESULT_LIMIT_EXCEEDED'
  /** The requested strategy or engine is unavailable or invalid in the current environment. */
  | 'CONFIGURATION_ERROR';

/** Stable error shape for callers that need to present actionable UI. */
export class AVAError extends Error {
  constructor(
    readonly code: AVAErrorCode,
    message: string,
    readonly details: Record<string, unknown> = {},
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AVAError';
  }
}
