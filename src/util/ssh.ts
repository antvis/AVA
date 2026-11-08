/** Create a verifier for the SHA-256 hex hashes supplied by ssh2's hostHash option. */
export function createSshHostVerifier(hostFingerprint: string): (hash: string) => boolean {
  if (typeof hostFingerprint !== 'string' || !/^SHA256:[A-Za-z0-9+/]{43}$/.test(hostFingerprint)) {
    throw new Error('SSH requires hostFingerprint in SHA256:<base64> format from a trusted source.');
  }
  const expectedHash = Buffer.from(hostFingerprint.slice('SHA256:'.length), 'base64').toString('hex');
  return (hash) => hash === expectedHash;
}
