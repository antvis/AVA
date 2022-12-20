import React, { ReactNode } from 'react';

import { isNumber } from 'lodash';

import { ArrowDown, ArrowUp } from '../../../assets/icons';
import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { NTV_PREFIX_CLS } from '../../../constants';
import { getThemeColor } from '../../../theme';

import type { NtvTypes } from '@antv/ava';
import type { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';
import type { ThemeType } from '../../../types';

function getCompareColor(assessment: NtvTypes.ValueAssessment, theme: ThemeType) {
  let color: string = getThemeColor('colorOtherValue', theme);
  if (assessment === 'positive') color = getThemeColor('colorPositive', theme);
  if (assessment === 'negative') color = getThemeColor('colorNegative', theme);
  return color;
}

function getComparePrefix(assessment: NtvTypes.ValueAssessment, [neg, pos]: [ReactNode, ReactNode]): ReactNode {
  let prefix = null;
  if (assessment === 'negative') prefix = neg;
  if (assessment === 'positive') prefix = pos;
  return prefix;
}

function getAssessmentText(value: string, metadata: NtvTypes.EntityMetaData) {
  return `${metadata?.assessment === 'negative' ? '-' : ''}${value}`;
}

const defaultDeltaValueDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: (value, { assessment }, { theme }) => getCompareColor(assessment, theme),
    prefix: (value, { assessment }) => getComparePrefix(assessment, ['-', '+']),
  },
  classNames: (value, { assessment }) => [`${NTV_PREFIX_CLS}-value-${assessment}`],
  getText: getAssessmentText,
  tooltip: {
    title: (value, metadata) => (isNumber(metadata.origin) ? `${metadata.origin}` : null),
  },
};

export const createDeltaValue = createEntityPhraseFactory('delta_value', defaultDeltaValueDescriptor);

const defaultRatioValueDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: (value, { assessment }, { theme }) => getCompareColor(assessment, theme),
    prefix: (value, { assessment }) => getComparePrefix(assessment, [<ArrowDown key="neg" />, <ArrowUp key="pos" />]),
  },
  classNames: (value, { assessment }) => [`${NTV_PREFIX_CLS}-value-${assessment}`],
  getText: getAssessmentText,
  tooltip: {
    title: (value, metadata) => (isNumber(metadata.origin) ? `${metadata.origin}` : null),
  },
};

export const createRatioValue = createEntityPhraseFactory('ratio_value', defaultRatioValueDescriptor);
