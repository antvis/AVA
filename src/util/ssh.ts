/** Create a verifier for the SHA-256 hex hashes supplied by ssh2's hostHash option. */
export function createSshHostVerifier(hostKeyFingerprint: string): (hash: string) => boolean {
  if (typeof hostKeyFingerprint !== 'string' || !/^SHA256:[A-Za-z0-9+/]{43}$/.test(hostKeyFingerprint)) {
    throw new Error('SSH requires hostKeyFingerprint in SHA256:<base64> format from a trusted source.');
  }
  const expectedHash = Buffer.from(hostKeyFingerprint.slice('SHA256:'.length), 'base64').toString('hex');
  return (hash) => hash === expectedHash;
}
