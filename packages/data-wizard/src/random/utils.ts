/**
 * merge default values
 * @param options
 * @param defaults
 */
export function initOptions<T, U>(options: T, defaults: U): T & U {
  const def: any = { ...defaults };
  Object.entries(options || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      def[key] = value;
    }
  });
  return def;
}

/**
 * @param value
 */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.substr(1);
}

export const MAX_INT = 2 ** 53 - 1;
export const MIN_INT = -MAX_INT;
