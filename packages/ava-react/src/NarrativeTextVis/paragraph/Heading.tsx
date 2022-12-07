import React from 'react';

import { getHeadingWeight } from '@antv/ava';
import { isNaN } from 'lodash';

import * as Elements from '../styled';
import { NTV_PREFIX_CLS } from '../constants';
import { Phrases } from '../phrases';
import { classnames as cx } from '../../utils';
import { presetPluginManager } from '../chore/plugin';

import type { NtvTypes } from '@antv/ava';
import type { ExtensionProps, PhraseEvents, ThemeStylesProps } from '../types';

type HeadingProps = ExtensionProps &
  ThemeStylesProps &
  PhraseEvents & {
    spec: NtvTypes.HeadingParagraphSpec;
  };

export function Heading({
  spec,
  theme = 'light',
  size = 'normal',
  pluginManager = presetPluginManager,
  ...events
}: HeadingProps) {
  const weight = getHeadingWeight(spec.type);
  const themeStyles = { theme, size };

  if (isNaN(weight)) return null;

  // eslint-disable-next-line import/namespace
  const Tag = Elements[`H${weight}`];

  return (
    <Tag {...themeStyles} className={cx(`${NTV_PREFIX_CLS}-h${weight}`, spec.className)} style={spec.styles}>
      <Phrases spec={spec.phrases} pluginManager={pluginManager} {...themeStyles} {...events} />
    </Tag>
  );
}
