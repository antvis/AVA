import { z } from 'zod';

export const errorCodeSchema = z.enum([
  'OPERATION_FAILED',
  'SOURCE_ERROR',
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
  return error instanceof AVAError
    ? error
    : new AVAError('MODEL_ERROR', 'The model request failed. Check the model configuration and service availability.');
}

/** Apply the provider error policy without swallowing metadata discovery errors. */
export async function withModelErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw safeModelError(error);
  }
}
