import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { seedToken } from '../../../theme';

import type { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';

const defaultMetricNameDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    fontWeight: 500,
    color: seedToken.colorMetricName,
  },
  tooltip: false,
};

export const createMetricName = createEntityPhraseFactory('metric_name', defaultMetricNameDescriptor);
