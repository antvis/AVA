import { afterEach, expect, it, vi } from 'vitest';

import { runWithTimeout } from '../../src/util/timeout';

afterEach(() => vi.useRealTimers());

it('preserves results and errors and clears the timer when an operation settles', async () => {
  vi.useFakeTimers();
  const error = new Error('operation failed');
  const onTimeout = vi.fn(() => new Error('timeout'));
  await expect(runWithTimeout(Promise.resolve(42), 100, { onTimeout })).resolves.toBe(42);
  await expect(runWithTimeout(Promise.reject(error), 100, { onTimeout })).rejects.toBe(error);
  expect(vi.getTimerCount()).toBe(0);
  expect(onTimeout).not.toHaveBeenCalled();
});

it('runs cancellation once and preserves the timeout error when cancellation rejects the operation', async () => {
  vi.useFakeTimers();
  let cancel: (error: Error) => void;
  const operation = new Promise<never>((_, reject) => {
    cancel = reject;
  });
  const error = new Error('timeout');
  const onTimeout = vi.fn(() => {
    cancel(new Error('interrupted'));
    return error;
  });
  const result = expect(runWithTimeout(operation, 100, { onTimeout, unref: true })).rejects.toBe(error);
  await vi.advanceTimersByTimeAsync(100);
  await result;
  expect(onTimeout).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it('disables the timer for nonpositive timeouts', async () => {
  vi.useFakeTimers();
  const onTimeout = vi.fn(() => new Error('timeout'));
  for (const timeoutMs of [0, -1]) {
    const result = runWithTimeout(Promise.resolve(42), timeoutMs, { onTimeout });
    expect(vi.getTimerCount()).toBe(0);
    await expect(result).resolves.toBe(42);
  }
  expect(onTimeout).not.toHaveBeenCalled();
});
