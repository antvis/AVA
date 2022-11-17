import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { seedToken } from '../../../theme';

import type { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';

const defaultTimeDescDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: seedToken.colorDimensionValue,
  },
  tooltip: false,
};

export const createTimeDesc = createEntityPhraseFactory('time_desc', defaultTimeDescDescriptor);
