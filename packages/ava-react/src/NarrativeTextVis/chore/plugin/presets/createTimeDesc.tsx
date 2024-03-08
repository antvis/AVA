import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { getThemeColor } from '../../../theme';

import type { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';

const defaultTimeDescDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: (value, metadata, { theme, palette }) =>
      getThemeColor({ colorToken: 'colorDimensionValue', theme, palette, type: 'time_desc' }),
  },
  tooltip: false,
};

export const createTimeDesc = createEntityPhraseFactory('time_desc', defaultTimeDescDescriptor);
