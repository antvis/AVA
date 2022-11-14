import { isArray } from './isType';

/**
 * Return an array with unique elements
 * @param value
 */
export function unique(value: unknown[]): unknown[] {
  return Array.from(new Set(value));
}

/**
 * Generate an array from 0 to number.
 * @param number
 */
export function range(number: Number) {
  return [...Array(number).keys()];
}

/**
 * assert
 * @param condition
 * @param errorMessage
 */
export function assert(condition: unknown, errorMessage?: string): asserts condition {
  if (!condition) throw new Error(errorMessage);
}

/**
 * Check parent-child relationship. A child has only one parent, but a parent can have more children.
 * @param parent
 * @param child
 */
export function isParentChild(parent: (string | number)[], child: (string | number)[]): boolean {
  if (
    !isArray(parent) ||
    parent.length === 0 ||
    !isArray(child) ||
    child.length === 0 ||
    parent.length !== child.length
  )
    return false;

  const record: Record<string | number, any> = {};
  for (let i = 0; i < child.length; i += 1) {
    const c = child[i];
    const p = parent[i];
    if (!record[c]) {
      record[c] = p;
    } else if (record[c] !== p) {
      return false;
    }
  }

  return true;
}
