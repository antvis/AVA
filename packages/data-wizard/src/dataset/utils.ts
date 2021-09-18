import { isArray, isObject, isNumber, isString, range, assert } from '../utils';
import type { Axis, Extra } from './types';

export const isBasicType = (value: any): boolean => {
  return !isArray(value) && !isObject(value);
};

export const isAxis = (value: any): value is Axis => {
  return isNumber(value) || isString(value);
};

// generate index for 1D and 2D array
export const generateArrayIndex = (data: any[], extra?: Extra): Axis[] => {
  assert(isArray(data), 'Data must be an array');

  if (extra?.index) {
    assert(extra.index?.length === data.length, `Index length is ${extra.index?.length}, but data size is ${data.length}`);

    return extra.index;
  }

  return range(data.length);
};
