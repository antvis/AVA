import { isArray, isObject, isNumber, isString, range } from '../utils';
import type { Axis, Extra } from './types';

export const isLegalBasicType = (value: any): boolean => {
  return !isArray(value) && !isObject(value);
};

export const isAxis = (value: any): value is Axis => {
  return isNumber(value) || isString(value);
};

// generate index for 1D and 2D array
export const generateArrayIndex = (data: any[], extra?: Extra): Axis[] => {
  if (isArray(data)) {
    if (extra?.index) {
      if (extra.index?.length === data.length) {
        return extra.index;
      }
      throw new Error(`Index length is ${extra.index?.length}, but data size is ${data.length}`);
    } else {
      return range(data.length);
    }
  } else {
    throw new Error('Data must be an array');
  }
};
