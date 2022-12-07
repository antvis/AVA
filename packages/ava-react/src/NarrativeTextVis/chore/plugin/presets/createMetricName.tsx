import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { getThemeColor } from '../../../theme';

import type { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';

const defaultMetricNameDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    fontWeight: 500,
    color: (value, metadata, { theme }) => getThemeColor('colorMetricName', theme),
  },
  tooltip: false,
};

export const createMetricName = createEntityPhraseFactory('metric_name', defaultMetricNameDescriptor);
