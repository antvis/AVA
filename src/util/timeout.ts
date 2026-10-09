/** Bound waiting for an operation; cancellation belongs to the caller. */
export async function runWithTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  options: { onTimeout: () => Error; unref?: boolean }
): Promise<T> {
  if (timeoutMs <= 0) return operation;

  const timeoutMarker = Symbol('timeout');
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      operation,
      new Promise<typeof timeoutMarker>((resolve) => {
        timeoutId = setTimeout(() => resolve(timeoutMarker), timeoutMs);
        if (options.unref) timeoutId.unref?.();
      }),
    ]);
    if (result === timeoutMarker) throw options.onTimeout();
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}
