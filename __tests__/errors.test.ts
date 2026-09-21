import { describe, expect, it } from 'vitest';

import { AVAError } from '../src';

describe('AVA errors', () => {
  it('exposes a stable code, details, and cause', () => {
    const cause = new Error('database error');
    const error = new AVAError('QUERY_TIMEOUT', 'timed out', { timeoutMs: 100 }, cause);

    expect(error).toMatchObject({
      name: 'AVAError',
      code: 'QUERY_TIMEOUT',
      details: { timeoutMs: 100 },
      cause,
    });
  });
});
