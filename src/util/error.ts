import { z } from 'zod';

export const errorCodeSchema = z.enum([
  'OPERATION_FAILED',
  'SOURCE_ERROR',
  'QUERY_ERROR',
  'AUTHENTICATION_FAILED',
  'MODEL_ERROR',
  'INVALID_REQUEST',
  'DATASET_UNAVAILABLE',
  'REQUEST_TIMEOUT',
  'CONNECTION_LOST',
  'INVALID_RESPONSE',
  'PAYLOAD_TOO_LARGE',
]);
export const errorOutcomeSchema = z.enum(['failed', 'unknown']);
export type ErrorCode = z.infer<typeof errorCodeSchema>;
export type ErrorOutcome = z.infer<typeof errorOutcomeSchema>;

/** Unknown means the caller must not assume the operation stopped or retry it blindly. */
export class AVAError extends Error {
  constructor(readonly code: ErrorCode, message: string, readonly outcome: ErrorOutcome = 'failed') {
    super(message);
    this.name = 'AVAError';
  }
}

export interface SerializedError {
  name?: string;
  message: string;
  code?: ErrorCode;
  outcome?: ErrorOutcome;
}

/** Convert a thrown value to serializable error details. Sensitive boundaries must normalize it first. */
export function serializeError(error: unknown): SerializedError {
  const details = error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) };
  return error instanceof AVAError ? { ...details, code: error.code, outcome: error.outcome } : details;
}

/** Keep the legacy message field while adding stable machine-readable status to IPC failures. */
export function failureResponse(error: unknown) {
  const details = serializeError(error);
  return {
    ok: false as const,
    error: details.message,
    code: details.code ?? 'OPERATION_FAILED',
    outcome: details.outcome ?? 'failed',
  };
}

export function safeModelError(error: unknown): AVAError {
  if (error instanceof AVAError) return error;
  const status = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined;
  const message =
    error instanceof Error && error.name === 'AI_NoObjectGeneratedError'
      ? 'The model response did not match the required schema.'
      : status === 401 || status === 403
      ? 'The model service rejected authentication. Check the model credentials and permissions.'
      : status === 429
      ? 'The model service rate limit was exceeded. Try again later.'
      : 'The model request failed. Check the model configuration and service availability.';
  return new AVAError('MODEL_ERROR', message);
}

/** Validation only sees the submitted DSL, never the source credentials or driver response. */
export async function withQueryErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AVAError) throw error;
    throw new AVAError('QUERY_ERROR', error instanceof Error ? error.message : 'The query is invalid.');
  }
}

/** Typed source/transport failures stop correction; unclassified local errors retain legacy behavior. */
export function canCorrectQuery(error: unknown): boolean {
  return !(error instanceof AVAError) || (error.code === 'QUERY_ERROR' && error.outcome === 'failed');
}
