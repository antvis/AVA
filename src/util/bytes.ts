const encoder = new TextEncoder();

/**
 * Return the UTF-8 byte length of a string.
 */
export function utf8ByteLength(value: string): number {
  return encoder.encode(value).byteLength;
}
