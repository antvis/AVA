import React from 'react';
import { isArray } from 'lodash';
import { SingleLineChart } from '../../../line-charts';
import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';
import { seedToken } from '../../../theme';

const defaultTrendDescDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: seedToken.colorConclusion,
    inlineChart: (value, { detail }) => {
      if (isArray(detail) && detail.length) return <SingleLineChart data={detail} />;
      return null;
    },
  },
  tooltip: false,
};

export const createTrendDesc = createEntityPhraseFactory('trend_desc', defaultTrendDescDescriptor);
