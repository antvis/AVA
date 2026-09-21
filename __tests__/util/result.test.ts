import { describe, expect, it } from 'vitest';

import { executionResult, maxResultBytes } from '../../src/util/result';
import { AVAError } from '../../src/util/error';

describe('executionResult', () => {
  it('defaults the result limit to 1 MiB', () => {
    expect(maxResultBytes()).toBe(1024 * 1024);
    expect(maxResultBytes({ maxResultBytes: 0 })).toBe(1);
  });

  it('returns only complete rows within the serialized byte limit', () => {
    const rows = [{ value: '你' }, { value: '好' }];
    const oneRowBytes = new TextEncoder().encode(JSON.stringify(rows[0])).byteLength;

    const result = executionResult(rows, [{ name: 'value' }], { maxResultBytes: oneRowBytes });

    expect(result.data).toEqual([rows[0]]);
    expect(result.truncated).toBe(true);
    expect(result.truncatedBy).toBe('maxResultBytes');
    expect(result.rowCount).toBeUndefined();
  });

  it('reports row-limit truncation', () => {
    const result = executionResult([{ value: 1 }, { value: 2 }], [], { maxRows: 1 });

    expect(result.truncated).toBe(true);
    expect(result.truncatedBy).toBe('maxRows');
  });

  it('omits the truncation reason for a complete result', () => {
    const result = executionResult([{ value: 1 }], []);

    expect(result).not.toHaveProperty('truncated');
    expect(result).not.toHaveProperty('truncatedBy');
  });

  it('rejects a field larger than 1 MiB', () => {
    expect(() => executionResult([{ value: 'x'.repeat(1024 * 1024) }], [])).toThrow(AVAError);
  });
});
