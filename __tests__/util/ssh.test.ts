import { describe, expect, it } from 'vitest';

import { createSshHostVerifier } from '../../src/util/ssh';

describe('createSshHostVerifier', () => {
  it.each([null, '', '*', 'SHA256:invalid', 123])('rejects an invalid fingerprint (%s)', (fingerprint) => {
    expect(() => createSshHostVerifier(fingerprint as string)).toThrow(/hostFingerprint/);
  });
});
