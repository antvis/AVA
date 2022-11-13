import { isFunction } from 'lodash';

import type { TypeOrMetaReturnType } from '../NarrativeTextVis/types';

export function functionalize<T>(val: TypeOrMetaReturnType<T>, defaultVal: T | undefined) {
  return isFunction(val) ? val : () => val || defaultVal;
}
