import * as utils from '../utils';
import type { Axis, Extra } from './types';

export const isLegalBasicType = (value: any): boolean => {
  return !utils.isArray(value) && !utils.isObject(value);
};

export const isAxis = (value: any): value is Axis => {
  return utils.isNumber(value) || utils.isString(value);
};

// generate index for 1D and 2D array
export const generateArrayIndex = (data: any[], extra?: Extra): Axis[] => {
  if (utils.isArray(data)) {
    if (extra?.index) {
      if (extra.index?.length === data.length) {
        return extra.index;
      }
      throw new Error(`Index length is ${extra.index?.length}, but data size is ${data.length}`);
    } else {
      return utils.range(data.length);
    }
  } else {
    throw new Error('Data must be an array');
  }
};
