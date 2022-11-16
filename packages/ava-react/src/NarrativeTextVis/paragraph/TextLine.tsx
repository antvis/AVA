import React from 'react';

import { P as StyledP } from '../styled';
import { Phrases } from '../phrases';
import { getPrefixCls, classnames as cx } from '../utils';
import { presetPluginManager } from '../chore/plugin';

import type { NtvTypes } from '@antv/ava';
import type { ThemeProps, ExtensionProps, PhraseEvents } from '../types';

type TextLineProps = ThemeProps &
  ExtensionProps &
  PhraseEvents & {
    spec: NtvTypes.TextParagraphSpec;
  };

export function TextLine({ spec, size = 'normal', pluginManager = presetPluginManager, ...events }: TextLineProps) {
  return (
    <StyledP size={size} className={cx(getPrefixCls('p'), spec.className)} style={spec.styles}>
      <Phrases spec={spec.phrases} size={size} pluginManager={pluginManager} {...events} />
    </StyledP>
  );
}
