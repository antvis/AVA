/**
 * Execute LLM-generated JavaScript analysis code.
 *
 * Note: This uses a simple Function constructor for code execution.
 * In production, consider using a more robust sandboxing solution.
 */

import { stat } from './stat';

/**
 * Execute analysis code with data and stat helpers.
 * The code must assign its final output to a variable named `result`.
 */
export function executeCode(data: any[], code: string): any {
  try {
    const func = new Function(
      'data',
      'stat',
      `
      ${code}
      return result;
      `,
    );

    return func(data, stat);
  } catch (error) {
    throw new Error(
      `Failed to execute data code: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
