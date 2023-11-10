import { Mark } from '@antv/g2';
import { flattenDeep, map } from 'lodash';

import { AugmentedMarks } from './types';

export const augmentedMarks2Marks = (augmentedMarks: AugmentedMarks): Mark[] => {
  return flattenDeep(map(augmentedMarks, (augmentedMark) => Object.values(augmentedMark)));
};
