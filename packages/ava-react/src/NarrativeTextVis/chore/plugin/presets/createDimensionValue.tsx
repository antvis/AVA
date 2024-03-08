import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { getThemeColor } from '../../../theme';

import type { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';

const defaultDimensionValueDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: (value, metadata, { theme, palette }) =>
      getThemeColor({ colorToken: 'colorDimensionValue', theme, palette, type: 'dim_value' }),
  },
  tooltip: false,
};

export const createDimensionValue = createEntityPhraseFactory('dim_value', defaultDimensionValueDescriptor);
