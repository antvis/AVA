export function isString(val: unknown): val is string {
  return typeof val === 'string';
}

export function isObject(val: unknown) {
  return val !== null && typeof val === 'object';
}

export function isUndefined(val: unknown) {
  return val === undefined;
}
