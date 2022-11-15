import React from 'react';

import { getHeadingWeight } from '@antv/ava';
import { isNaN } from 'lodash';

import * as Elements from '../styled';
import { Phrases } from '../phrases';
import { getPrefixCls, classnames as cx } from '../../utils';
import { presetPluginManager } from '../chore/plugin';

import type { NtvTypes } from '@antv/ava';
import type { ExtensionProps, PhraseEvents } from '../types';

type HeadingProps = ExtensionProps &
  PhraseEvents & {
    spec: NtvTypes.HeadingParagraphSpec;
  };

export function Heading({ spec, pluginManager = presetPluginManager, ...events }: HeadingProps) {
  const weight = getHeadingWeight(spec.type);
  if (isNaN(weight)) return null;
  // eslint-disable-next-line import/namespace
  const Tag = Elements[`H${weight}`];
  return (
    <Tag className={cx(getPrefixCls(`h${weight}`), spec.className)} style={spec.styles}>
      <Phrases spec={spec.phrases} pluginManager={pluginManager} {...events} />
    </Tag>
  );
}
