import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { getThemeColor } from '../../../theme';
import { isNumberLike } from '../../../../utils';

import type { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';

const defaultContributeRatioDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: (value, metadata, { theme, entityStyle }) =>
      getThemeColor('colorConclusion', theme, entityStyle?.contribute_ratio),
  },
  tooltip: {
    title: (value, metadata) => (isNumberLike(metadata.origin) ? `${metadata.origin}` : null),
  },
};

export const createContributeRatio = createEntityPhraseFactory('contribute_ratio', defaultContributeRatioDescriptor);
