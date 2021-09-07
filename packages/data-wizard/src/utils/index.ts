import * as analyzer from '../analyzer/is-date';

export function isNull(value: any): boolean {
  return value === null || value === undefined || value === '' || Number.isNaN(value as number) || value === 'null';
}

export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: any): value is number => {
  return typeof value === 'number';
};

/**
 * Checks if value is an digit
 * @param value
 * @returns
 */
export function isDigit(value: string): boolean {
  let hasDot = false;
  let tempValue = value;
  if (/^[+-]/.test(tempValue)) {
    tempValue = tempValue.slice(1);
  }
  for (let i = 0; i < tempValue.length; i += 1) {
    const char = tempValue[i];
    if (char === '.') {
      if (hasDot === false) {
        hasDot = true;
      } else {
        return false;
      }
    }
    if (char !== '.' && !/[0-9]/.test(char)) {
      return false;
    }
  }
  return tempValue.trim() !== '';
}

export function isInteger(value: any, convertString?: boolean): value is number {
  if (typeof value === 'number') return Number.isInteger(value);
  if (convertString && isString(value) && isDigit(value)) return !value.includes('.');
  return false;
}

export function isFloat(value: any, convertString?: boolean): boolean {
  if (typeof value === 'number') return !Number.isNaN(value) && !Number.isInteger(value);
  if (convertString && isString(value) && isDigit(value)) return value.includes('.');
  return false;
}

export function isDate(value: any, convertString?: boolean): value is Date {
  if (value && Object.getPrototypeOf(value) === Date.prototype) return true;
  if (convertString && isString(value)) return analyzer.isDateString(value);
  return false;
}

export function isBoolean(value: any, convertStringAndNumber?: boolean): boolean {
  return convertStringAndNumber
    ? [
        [true, false],
        [0, 1],
        ['true', 'false'],
        ['Yes', 'No'],
        ['True', 'False'],
        ['0', '1'],
        ['是', '否'],
      ].some((list: any[]) => {
        return value.every((item: any) => list.includes(item));
      })
    : typeof value === 'boolean';
}

export const isObject = (value: any): value is object => {
  return value && Object.getPrototypeOf(value) === Object.prototype;
};

export const isArray = (value: any): value is any[] => {
  return Array.isArray(value);
};

export function unique(array: any[]): any[] {
  return Array.from(new Set(array));
}

/**
 * generate an array from 0 to number
 * @param number
 */
export const range = (number: Number) => {
  return [...Array(number).keys()];
};

export type Assert = (condition: any, errorMessage?: string) => asserts condition;
/**
 * assert
 * @param condition
 * @param errorMessage
 */
 export const assert: Assert = (condition, errorMessage) => {
  if (!condition) throw new Error(errorMessage);
};
