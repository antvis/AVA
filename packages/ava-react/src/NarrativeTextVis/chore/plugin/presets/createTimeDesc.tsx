import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';
import { seedToken } from '../../../theme';

const defaultTimeDescDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: seedToken.colorDimensionValue,
  },
  tooltip: false,
};

export const createTimeDesc = createEntityPhraseFactory('time_desc', defaultTimeDescDescriptor);
