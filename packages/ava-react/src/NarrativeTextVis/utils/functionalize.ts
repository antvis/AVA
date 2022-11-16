import { isFunction } from 'lodash';
import { TypeOrMetaReturnType } from '@antv/narrative-text-schema';

export function functionalize<T>(val: TypeOrMetaReturnType<T>, defaultVal: T | undefined) {
  return isFunction(val) ? val : () => val || defaultVal;
}
