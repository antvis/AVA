export interface SerializedError {
  name?: string;
  message: string;
  category?: string;
  status?: number;
}

/** Convert a thrown value to serializable error details. */
export function serializeError(error: unknown): SerializedError {
  if (!(error instanceof Error)) return { message: String(error) };

  const details = error as Error & { category?: unknown; status?: unknown };
  return {
    name: error.name,
    message: error.message,
    ...(typeof details.category === 'string' ? { category: details.category } : {}),
    ...(typeof details.status === 'number' && Number.isInteger(details.status) ? { status: details.status } : {}),
  };
}

/** Restore serialized error details received across a process boundary. */
export function deserializeError(details: SerializedError): Error & Pick<SerializedError, 'category' | 'status'> {
  const error = new Error(details.message) as Error & Pick<SerializedError, 'category' | 'status'>;
  if (details.name) error.name = details.name;
  if (details.category !== undefined) error.category = details.category;
  if (details.status !== undefined) error.status = details.status;
  return error;
}
