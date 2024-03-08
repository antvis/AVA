import React from 'react';

import { getHeadingWeight } from '@antv/ava';
import { isNaN } from 'lodash';

import * as Elements from '../styled';
import { NTV_PREFIX_CLS } from '../constants';
import { Phrases } from '../phrases';
import { classnames as cx } from '../../utils';
import { presetPluginManager } from '../chore/plugin';

import type { HeadingParagraphSpec } from '@antv/ava';
import type { ExtensionProps, PhraseEvents, ThemeStylesProps } from '../types';

type HeadingProps = ExtensionProps &
  ThemeStylesProps &
  PhraseEvents & {
    spec: HeadingParagraphSpec;
  };

export function Heading({
  spec,
  theme = 'light',
  size = 'normal',
  palette,
  pluginManager = presetPluginManager,
  // TODO 标题支持展开收起
  // showCollapse = false,
  ...events
}: HeadingProps) {
  const weight = getHeadingWeight(spec.type);
  const themeStyles = { theme, size, palette };

  if (isNaN(weight)) return null;

  // eslint-disable-next-line import/namespace
  const Tag = Elements[`H${weight}`];

  return (
    <Tag {...themeStyles} className={cx(`${NTV_PREFIX_CLS}-h${weight}`, spec.className)} style={spec.styles}>
      <Phrases spec={spec.phrases} pluginManager={pluginManager} {...themeStyles} {...events} />
    </Tag>
  );
}
