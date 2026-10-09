/**
 * Unit tests for src/interpreter/javascript/sandbox.ts
 */

import { describe, it, expect } from 'vitest';

import { executeCode } from '../../../src/interpreter/javascript/sandbox';

describe('interpreter/javascript/sandbox', () => {
  it('executes code with data and stat helpers', async () => {
    const data = [{ value: 10 }, { value: 20 }];
    const result = await executeCode(data, 'const result = stat.sum(data, "value");');
    expect(result).toBe(30);
  });

  it('returns arrays computed by the code', async () => {
    const data = [{ value: 10 }, { value: 20 }];
    const result = await executeCode(data, 'const result = data.map(d => d.value * 2);');
    expect(result).toEqual([20, 40]);
  });

  it('wraps execution errors', async () => {
    await expect(executeCode([], 'throw new Error("boom")')).rejects.toThrow(
      'Failed to execute data code: boom',
    );
  });
});
