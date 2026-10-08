import { execFile } from 'node:child_process';

import type { PythonEngineOptions } from '../../types';

/** Local subprocess execution, not a security sandbox. Requires python3 and pandas. */
export const createPythonExecutor = (timeoutMs: number, maxBuffer: number): NonNullable<PythonEngineOptions['execute']> =>
  (code) => new Promise((resolve, reject) => {
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
        if (error) {
          reject(new Error(`Python execution failed (requires python3 and pandas): ${stderr.trim() || error.message}`));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error('Python returned an invalid JSON result'));
        }
      }
    );
    child.stdin!.on('error', reject);
    child.stdin!.end(code);
  });
