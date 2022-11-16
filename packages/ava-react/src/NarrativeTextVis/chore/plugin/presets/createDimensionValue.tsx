import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { seedToken } from '../../../theme';

import type { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';

const defaultDimensionValueDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: seedToken.colorDimensionValue,
  },
  tooltip: false,
};

export const createDimensionValue = createEntityPhraseFactory('dim_value', defaultDimensionValueDescriptor);
