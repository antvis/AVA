import { isDateString, intDatePartners } from './is-date';

export { intDatePartners };

export function assert(test: any, errorMessage: string): void {
  if (test) throw new Error(errorMessage);
}

export function isNull(source: any): boolean {
  return (
    source === null || source === undefined || source === '' || Number.isNaN(source as number) || 'null' === source
  );
}

export function isInteger(source: any): boolean {
  if (typeof source === 'number') return Number.isInteger(source);
  if (typeof source === 'string' && isDigit(source)) return !source.includes('.');
  return false;
}

export function isFloat(source: any): boolean {
  if (typeof source === 'number') return !Number.isNaN(source) && !Number.isInteger(source);
  if (typeof source === 'string' && isDigit(source)) return source.includes('.');
  return false;
}

export function isDate(source: any): boolean {
  if (Object.getPrototypeOf(source) === Date.prototype) return true;
  if (typeof source === 'string') return isDateString(source);
  return false;
}

export function unique(array: any[]): any[] {
  return Array.from(new Set(array));
}

/**
 * remove the row which contains missing value
 * @param x - the array to process
 * @param y - another array to process
 */
export function removeEmptyRow(x: any[], y: any[]): [any[], any[]] {
  const newx: any[] = [];
  const newy: any[] = [];
  for (let i = 0; i < x.length; i++) {
    if (!isNull(x[i]) && !isNull(y[i])) {
      newx.push(x[i]);
      newy.push(y[i]);
    }
  }
  return [newx, newy];
}

/** Checks if value is an digit*/
export function isDigit(source: string): boolean {
  let hasDot = false;
  if (/^[+-]/.test(source)) {
    source = source.slice(1);
  }
  for (const char of source) {
    if (char === '.') {
      if (hasDot === false) {
        hasDot = true;
        continue;
      } else {
        return false;
      }
    }
    if (!/[0-9]/.test(char)) {
      return false;
    }
  }
  return source.trim() !== '';
}
