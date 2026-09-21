export type AVAErrorCode =
  | 'QUERY_TIMEOUT'
  | 'RESOURCE_LIMIT_EXCEEDED'
  | 'RESULT_LIMIT_EXCEEDED'
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
