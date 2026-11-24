/**
 * Cancellation helpers shared by the analysis pipeline and the CLI session.
 * Every helper accepts an optional signal so existing callers stay unchanged.
 */

/** Error raised when an operation is cancelled through an AbortSignal. */
export function createAbortError(message = 'Operation aborted'): Error {
  if (typeof DOMException !== 'undefined') return new DOMException(message, 'AbortError');

  const error = new Error(message);
  error.name = 'AbortError';

  return error;
}

function abortReason(signal: AbortSignal): Error {
  return signal.reason instanceof Error ? signal.reason : createAbortError();
}

/** Throw the abort reason (or a standard AbortError) when the signal is already aborted. */
export function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  throw abortReason(signal);
}

/**
 * Run a listener when the signal aborts.
 * Returns a disposer so callers can detach it in a finally block.
 */
export function onAbort(signal: AbortSignal | undefined, listener: (reason: Error) => void): () => void {
  if (!signal) return () => {};
  const abort = () => listener(abortReason(signal));
  if (signal.aborted) {
    abort();
    return () => {};
  }
  signal.addEventListener('abort', abort, { once: true });

  return () => signal.removeEventListener('abort', abort);
}
