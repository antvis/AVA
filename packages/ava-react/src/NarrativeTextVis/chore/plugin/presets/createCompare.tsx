import React, { ReactNode } from 'react';
import { ValueAssessment, EntityMetaData } from '@antv/narrative-text-schema';
import { isNumber } from 'lodash';
import { ArrowDown, ArrowUp } from '../../../assets/icons';
import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';
import { getPrefixCls } from '../../../utils';
import { seedToken } from '../../../theme';

const defaultDeltaValueDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: (value, { assessment }) => getCompareColor(assessment),
    prefix: (value, { assessment }) => getComparePrefix(assessment, ['-', '+']),
  },
  classNames: (value, { assessment }) => [getPrefixCls(`value-${assessment}`)],
  getText: getAssessmentText,
  tooltip: {
    title: (value, metadata) => (isNumber(metadata.origin) ? `${metadata.origin}` : null),
  },
};

export const createDeltaValue = createEntityPhraseFactory('delta_value', defaultDeltaValueDescriptor);

const defaultRatioValueDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: (value, { assessment }) => getCompareColor(assessment),
    prefix: (value, { assessment }) => getComparePrefix(assessment, [<ArrowDown />, <ArrowUp />]),
  },
  classNames: (value, { assessment }) => [getPrefixCls(`value-${assessment}`)],
  getText: getAssessmentText,
  tooltip: {
    title: (value, metadata) => (isNumber(metadata.origin) ? `${metadata.origin}` : null),
  },
};

export const createRatioValue = createEntityPhraseFactory('ratio_value', defaultRatioValueDescriptor);

function getCompareColor(assessment: ValueAssessment) {
  let color;
  if (assessment === 'positive') color = seedToken.colorPositive;
  if (assessment === 'negative') color = seedToken.colorNegative;
  return color;
}

function getComparePrefix(assessment: ValueAssessment, [neg, pos]: [ReactNode, ReactNode]): ReactNode {
  let prefix = null;
  if (assessment === 'negative') prefix = neg;
  if (assessment === 'positive') prefix = pos;
  return prefix;
}

function getAssessmentText(value: string, metadata: EntityMetaData) {
  return `${metadata?.assessment === 'negative' ? '-' : ''}${value}`;
}
