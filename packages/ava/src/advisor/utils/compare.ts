import isNil from './isNil';

import type { BasicDataPropertyForAdvice } from '../ruler/type';

const compare = (f1: BasicDataPropertyForAdvice, f2: BasicDataPropertyForAdvice): number => {
  if (isNil(f1.distinct) || isNil(f2.distinct)) {
    if (f1.distinct! < f2!.distinct!) {
      return 1;
    }
    if (f1.distinct! > f2.distinct!) {
      return -1;
    }
    return 0;
  }
  return 0;
};

export default compare;
