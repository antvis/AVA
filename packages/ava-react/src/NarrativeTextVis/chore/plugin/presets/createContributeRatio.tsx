import { isNumber } from 'lodash';

import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { seedToken } from '../../../theme';

import type { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';

const defaultContributeRatioDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: seedToken.colorConclusion,
  },
  tooltip: {
    title: (value, metadata) => (isNumber(metadata.origin) ? `${metadata.origin}` : null),
  },
};

export const createContributeRatio = createEntityPhraseFactory('contribute_ratio', defaultContributeRatioDescriptor);
