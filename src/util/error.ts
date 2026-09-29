/** Convert a thrown value to serializable error details. */
export function serializeError(error: unknown): { name?: string; message: string } {
  return error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) };
}
