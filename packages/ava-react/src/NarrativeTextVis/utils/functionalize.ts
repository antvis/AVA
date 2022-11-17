import { isFunction } from 'lodash';

import type { TypeOrMetaReturnType } from '../types';

export function functionalize<T>(val: TypeOrMetaReturnType<T>, defaultVal: T | undefined) {
  return isFunction(val) ? val : () => val || defaultVal;
}
