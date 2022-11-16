import { isNumber } from 'lodash';
import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';
import { seedToken } from '../../../theme';

const defaultOtherMetricValueDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    fontWeight: 'bold',
    color: seedToken.colorOtherValue,
  },
  tooltip: {
    title: (value, metadata) => (isNumber(metadata.origin) ? `${metadata.origin}` : null),
  },
};

export const createOtherMetricValue = createEntityPhraseFactory(
  'other_metric_value',
  defaultOtherMetricValueDescriptor,
);
