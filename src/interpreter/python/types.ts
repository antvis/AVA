import type { ExecutionResult } from '../../contracts/result';

/**
 * Python engine options.
 */
export interface PythonEngineOptions {
  /**
   * Override local python3 execution with a custom environment. Local execution is not sandboxed.
   * Run the complete Python script and return its JSON output as ExecutionResult.
   * Each query first sends a compile-only validation script, then the source-loading and result script.
   * Configure remote execution deadlines separately.
   */
  execute?: (code: string) => Promise<ExecutionResult>;
  /** Wait and local process deadline for each validation or execution call. Default 30000 ms. */
  queryTimeoutMs?: number;
}
