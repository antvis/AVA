import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';
import { seedToken } from '../../../theme';

const defaultMetricNameDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    fontWeight: 500,
    color: seedToken.colorMetricName,
  },
  tooltip: false,
};

export const createMetricName = createEntityPhraseFactory('metric_name', defaultMetricNameDescriptor);
