import { execFile } from 'node:child_process';

import { onAbort, throwIfAborted } from '../../../util/abort';

import type { ExecutionResult } from '../../../types';

/** Local subprocess execution, not a security sandbox. Requires python3 and pandas. */
export const createPythonExecutor =
  (timeoutMs: number) =>
  async (code: string, maxBuffer: number, signal?: AbortSignal): Promise<ExecutionResult> => {
    throwIfAborted(signal);
    const pending = new Promise<ExecutionResult>((resolve, reject) => {
      let inputError: Error | undefined;
      let detach: (() => void) | undefined;
      const child = execFile(
        'python3',
        ['-'],
        {
          timeout: timeoutMs,
          killSignal: 'SIGKILL',
          maxBuffer,
          encoding: 'utf8',
        },
        (error, stdout, stderr) => {
          detach?.();
          const failure = error ?? inputError;
          if (failure) {
            reject(
              new Error(`Python execution failed (requires python3 and pandas): ${stderr.trim() || failure.message}`)
            );
            return;
          }
          try {
            resolve(JSON.parse(stdout));
          } catch {
            reject(new Error('Python returned an invalid JSON result'));
          }
        }
      );
      // Kill explicitly so cancellation uses SIGKILL and execFile waits for the child and its pipes to close.
      const terminate = () => {
        child.stdout?.destroy();
        child.stderr?.destroy();
        if (!child.killed) child.kill('SIGKILL');
      };
      detach = onAbort(signal, terminate);
      child.stdin!.on('error', (error) => {
        inputError = error;
        terminate();
      });
      child.stdin!.end(code);
    });
    try {
      const result = await pending;
      throwIfAborted(signal);
      return result;
    } catch (error) {
      throwIfAborted(signal);
      throw error;
    }
  };
