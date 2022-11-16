import { isNumber } from 'lodash';
import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';
import { seedToken } from '../../../theme';

const defaultMetricValueDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: seedToken.colorMetricValue,
  },
  tooltip: {
    title: (value, metadata) => (isNumber(metadata.origin) ? `${metadata.origin}` : null),
  },
};

export const createMetricValue = createEntityPhraseFactory('metric_value', defaultMetricValueDescriptor);
