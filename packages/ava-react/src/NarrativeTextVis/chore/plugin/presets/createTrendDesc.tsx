import React from 'react';

import { isArray } from 'lodash';

import { SingleLineChart } from '../../../line-charts';
import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { getThemeColor } from '../../../theme';

import type { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';

const defaultTrendDescDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: (value, metadata, { theme }) => getThemeColor('colorConclusion', theme),
    inlineChart: (value, { detail }, themeStyles) => {
      if (isArray(detail) && detail.length) return <SingleLineChart data={detail} {...themeStyles} />;
      return null;
    },
  },
  tooltip: false,
};

export const createTrendDesc = createEntityPhraseFactory('trend_desc', defaultTrendDescDescriptor);
