/**
 * Unit tests for src/interpreter/sandbox.ts
 */

import { describe, it, expect } from 'vitest';

import { executeCode } from '../../src/interpreter/sandbox';

describe('interpreter/sandbox', () => {
  it('executes code with data and stat helpers', () => {
    const data = [{ value: 10 }, { value: 20 }];
    const result = executeCode(data, 'const result = stat.sum(data, "value");');
    expect(result).toBe(30);
  });

  it('returns arrays computed by the code', () => {
    const data = [{ value: 10 }, { value: 20 }];
    const result = executeCode(data, 'const result = data.map(d => d.value * 2);');
    expect(result).toEqual([20, 40]);
  });

  it('wraps execution errors', () => {
    expect(() => executeCode([], 'throw new Error("boom")')).toThrow(
      'Failed to execute data code: boom',
    );
  });
});
