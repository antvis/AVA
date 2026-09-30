export interface SerializedError {
  name?: string;
  message: string;
}

/** Convert a thrown value to serializable error details. */
export function serializeError(error: unknown): SerializedError {
  return error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) };
}
