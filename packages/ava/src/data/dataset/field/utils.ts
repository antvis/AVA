import { isArray, isNumber, isString, range, assert, isBoolean, isNil, isDate } from '../../utils';

import type { Axis, Extra } from './types';

export function isAxis(value: unknown): value is Axis {
  return isNumber(value) || isString(value);
}

// generate indexes for 1D and 2D array
export function generateArrayIndex(data: unknown[], extraIndex?: Axis[]): Axis[] {
  assert(isArray(data), 'Data must be an array');

  if (extraIndex) {
    assert(
      extraIndex?.length === data.length,
      `Index length is ${extraIndex?.length}, but data size is ${data.length}`
    );

    return extraIndex;
  }

  return range(data.length);
}

export function fillMissingValue(datum: unknown, fillValue: any): unknown {
  return !datum && JSON.stringify(fillValue) ? fillValue : datum;
}

export function generateSplit(length: number) {
  return Array(isNumber(length) ? length : 0)
    .fill(' ')
    .concat('  ')
    .join('');
}

export function stringify(value: unknown) {
  return (
    JSON.stringify(value)
      ?.replace(/\\n/g, '')
      ?.replace(/\\/g, '')
      ?.replace(/"\[/g, '[')
      ?.replace(/\]"/g, ']')
      ?.replace(/"\{/g, '{')
      ?.replace(/\}"/g, ' }') || 'undefined'
  );
}

export function getStringifyLength(value: unknown) {
  return stringify(value)?.length;
}

/**
 * Convert data to specified data type.
 * @param data
 * @param type
 */
export function convertDataType(data: unknown, type: Extra['columnTypes'][number]) {
  try {
    if (type === 'string' && !isString(data)) {
      return `${data}`;
    }
    if (type === 'boolean' && !isBoolean(data)) {
      return Boolean(data);
    }
    if (type === 'null' && !isNil(data)) {
      return null;
    }
    if ((type === 'integer' || type === 'float') && !isNumber(data)) {
      return +data;
    }
    if (type === 'date' && !isDate(data) && (isNumber(data) || isString(data))) {
      return new Date(data);
    }
  } catch (error) {
    throw new Error(error);
  }
  return data;
}
