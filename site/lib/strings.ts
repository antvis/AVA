/** Trim strings, discard non-strings and empty values, and deduplicate in input order. */
export function uniqueStrings(values: readonly unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean))];
}
