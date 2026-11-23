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

/** Throw the abort reason (or a standard AbortError) when the signal is already aborted. */
export function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  throw signal.reason instanceof Error ? signal.reason : createAbortError();
}

/**
 * Run a listener when the signal aborts.
 * Returns a disposer so callers can detach it in a finally block.
 */
export function onAbort(signal: AbortSignal | undefined, listener: () => void): () => void {
  if (!signal) return () => {};
  if (signal.aborted) {
    listener();
    return () => {};
  }
  signal.addEventListener('abort', listener, { once: true });

  return () => signal.removeEventListener('abort', listener);
}
