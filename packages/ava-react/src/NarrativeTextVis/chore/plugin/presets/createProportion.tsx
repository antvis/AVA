import React from 'react';

import { isNaN } from 'lodash';

import { ProportionChart } from '../../../line-charts';
import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { isNumberLike } from '../../../../utils';

import type { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';

function getProportionNumber(text: string, value?: number | undefined): number {
  if (value && !isNaN(value)) return value;
  if (text?.endsWith('%')) {
    const percentageValue = text?.replace(/%$/, '');
    if (!isNaN(Number(percentageValue))) return Number(percentageValue) / 100;
  }
  return NaN;
}

const defaultProportionDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    inlineChart: (value, { origin }, themeStyles) => (
      <ProportionChart data={getProportionNumber(value, origin as number)} {...themeStyles} />
    ),
  },
  tooltip: {
    title: (value, metadata) => (isNumberLike(metadata.origin) ? `${metadata.origin}` : null),
  },
};

export const createProportion = createEntityPhraseFactory('proportion', defaultProportionDescriptor);
