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

    const result = executionResult(rows, [{ name: 'value' }], 10, { maxResultBytes: oneRowBytes });

    expect(result.data).toEqual([rows[0]]);
    expect(result.truncated).toBe(true);
    expect(result.rowCount).toBeUndefined();
  });

  it('rejects a field larger than 1 MiB', () => {
    expect(() => executionResult([{ value: 'x'.repeat(1024 * 1024) }], [], 10)).toThrow(
      'Result field exceeds the 1 MiB limit'
    );
  });
});
