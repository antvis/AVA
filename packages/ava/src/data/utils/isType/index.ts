import { isDateString } from '../analyzer/is-date';

export const isNull = (value: any): boolean => {
  return value === null || value === undefined || value === '' || Number.isNaN(value as number) || value === 'null';
};

export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !Number.isNaN(value);
};

/**
 * Checks if value is an digit
 * @param value
 * @returns
 */
export const isDigit = (value: string): boolean => {
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
};

export const isInteger = (value: any, convertString?: boolean): value is number => {
  if (typeof value === 'number') return Number.isInteger(value);
  if (convertString && isString(value) && isDigit(value)) return !value.includes('.');
  return false;
};

export const isFloat = (value: any, convertString?: boolean): boolean => {
  if (typeof value === 'number') return !Number.isNaN(value) && !Number.isInteger(value);
  if (convertString && isString(value) && isDigit(value)) return value.includes('.');
  return false;
};

export const isDate = (value: any, convertString?: boolean): value is Date => {
  if (value && Object.getPrototypeOf(value) === Date.prototype) return true;
  if (convertString && isString(value)) return isDateString(value);
  return false;
};

export const isBoolean = (value: any, convertStringAndNumber?: boolean): boolean => {
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
};

export const isObject = (value: any): value is object => {
  return value && Object.getPrototypeOf(value) === Object.prototype;
};

export const isArray = (value: any): value is any[] => {
  return Array.isArray(value);
};

export const isBasicType = (value: any): boolean => {
  return !isArray(value) && !isObject(value);
};

export const unique = (array: any[]): any[] => {
  return Array.from(new Set(array));
};

/**
 * Generate an array from 0 to number.
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

/**
 * Judge parent-child relationship. A child has only one parent, but a parent can have more children.
 * @param parent
 * @param child
 */
export const isParentChild = (parent: any[], child: any[]): boolean => {
  if (
    !isArray(parent) ||
    parent.length === 0 ||
    !isArray(child) ||
    child.length === 0 ||
    parent.length !== child.length
  )
    return false;

  const record: any = {};
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
};

/**
 * Return the flattened result of the array.
 * @param array - The array to process
 */
export function flatten(array: any[]) {
  let res = [];
  for (let i = 0; i < array.length; i += 1) {
    if (isArray(array[i])) {
      res = res.concat(flatten(array[i]));
    } else {
      res.push(array[i]);
    }
  }
  return res;
}
