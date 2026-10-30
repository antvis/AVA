import { describe, expect, it } from 'vitest';

import { addUsage } from '../../src/util/usage';

const usage = {
  inputTokens: 10,
  outputTokens: 5,
  totalTokens: 15,
  inputTokenDetails: { noCacheTokens: 8, cacheReadTokens: 2, cacheWriteTokens: undefined },
  outputTokenDetails: { textTokens: 4, reasoningTokens: 1 },
};

describe('addUsage', () => {
  it('sums reported counts and keeps missing counts unknown', () => {
    expect(addUsage(usage, { ...usage, inputTokens: undefined })).toEqual({
      inputTokens: undefined,
      outputTokens: 10,
      totalTokens: 30,
      inputTokenDetails: { noCacheTokens: 16, cacheReadTokens: 4, cacheWriteTokens: undefined },
      outputTokenDetails: { textTokens: 8, reasoningTokens: 2 },
    });
  });
});
