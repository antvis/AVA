import React, { ReactNode } from 'react';

import { ValueAssessment, EntityMetaData, EntityType } from '@antv/ava';

import { ArrowDown, ArrowUp } from '../../../assets/icons';
import { createEntityPhraseFactory } from '../createEntityPhraseFactory';
import { NTV_PREFIX_CLS } from '../../../constants';
import { getThemeColor } from '../../../theme';
import { isNumberLike } from '../../../../utils';

import type { SpecificEntityPhraseDescriptor } from '../plugin-protocol.type';
import type { ThemeStylesProps } from '../../../types';

function getCompareColor(
  assessment: ValueAssessment,
  theme: ThemeStylesProps['theme'],
  palette: ThemeStylesProps['entityStyle'][EntityType]
) {
  // 优先取色板配置的颜色
  const { negativeColor, positiveColor, color: primaryColor } = palette || {};
  let color: string = primaryColor ?? getThemeColor('colorOtherValue', theme);
  if (assessment === 'positive') color = positiveColor ?? getThemeColor('colorPositive', theme);
  if (assessment === 'negative') color = negativeColor ?? getThemeColor('colorNegative', theme);
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

const defaultDeltaValueDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: (value, { assessment }, { theme, entityStyle }) =>
      getCompareColor(assessment, theme, entityStyle?.delta_value),
    prefix: (value, { assessment }) => getComparePrefix(assessment, ['-', '+']),
  },
  classNames: (value, { assessment }) => [`${NTV_PREFIX_CLS}-value-${assessment}`],
  getText: getAssessmentText,
  tooltip: {
    title: (value, metadata) => (isNumberLike(metadata.origin) ? `${metadata.origin}` : null),
  },
};

export const createDeltaValue = createEntityPhraseFactory('delta_value', defaultDeltaValueDescriptor);

const defaultRatioValueDescriptor: SpecificEntityPhraseDescriptor = {
  encoding: {
    color: (value, { assessment }, { theme, entityStyle }) =>
      getCompareColor(assessment, theme, entityStyle?.ratio_value),
    prefix: (value, { assessment }) => getComparePrefix(assessment, [<ArrowDown key="neg" />, <ArrowUp key="pos" />]),
  },
  classNames: (value, { assessment }) => [`${NTV_PREFIX_CLS}-value-${assessment}`],
  getText: getAssessmentText,
  tooltip: {
    title: (value, metadata) => (isNumberLike(metadata.origin) ? `${metadata.origin}` : null),
  },
};

export const createRatioValue = createEntityPhraseFactory('ratio_value', defaultRatioValueDescriptor);
