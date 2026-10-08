import { describe, expect, it } from 'vitest';

import { executionResult, maxResultBytes } from '../../src/util/result';

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

  it.each(['maxRows', 'maxResultBytes'] as const)('preserves upstream %s truncation', (reason) => {
    const result = executionResult([{ value: 1 }], [], {}, reason);

    expect(result.truncated).toBe(true);
    expect(result.truncatedBy).toBe(reason);
    expect(result.rowCount).toBeUndefined();
  });

  it('reports the local limit when it truncates an upstream result further', () => {
    const rows = [{ value: 1 }, { value: 2 }];
    const rowLimited = executionResult(rows, [], { maxRows: 1 }, 'maxResultBytes');
    expect(rowLimited.data).toEqual([rows[0]]);
    expect(rowLimited.truncatedBy).toBe('maxRows');

    const byteLimited = executionResult(rows, [], { maxResultBytes: 1 }, 'maxRows');
    expect(byteLimited.data).toEqual([]);
    expect(byteLimited.truncatedBy).toBe('maxResultBytes');
    expect(byteLimited.rowCount).toBeUndefined();
  });

  it('rejects a field larger than 1 MiB', () => {
    expect(() => executionResult([{ value: 'x'.repeat(1024 * 1024) }], [])).toThrow(
      'Result field exceeds the 1 MiB limit'
    );
  });
});
