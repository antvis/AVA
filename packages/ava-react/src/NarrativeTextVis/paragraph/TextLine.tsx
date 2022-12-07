import React from 'react';

import { NTV_PREFIX_CLS } from '../constants';
import { P as StyledP } from '../styled';
import { Phrases } from '../phrases';
import { classnames as cx } from '../../utils';
import { presetPluginManager } from '../chore/plugin';

import type { NtvTypes } from '@antv/ava';
import type { ThemeStylesProps, ExtensionProps, PhraseEvents } from '../types';

type TextLineProps = ThemeStylesProps &
  ExtensionProps &
  PhraseEvents & {
    spec: NtvTypes.TextParagraphSpec;
  };

export function TextLine({
  spec,
  size = 'normal',
  theme = 'light',
  pluginManager = presetPluginManager,
  ...events
}: TextLineProps) {
  const themeStyles = { size, theme };
  return (
    <StyledP {...themeStyles} className={cx(`${NTV_PREFIX_CLS}-p`, spec.className)} style={spec.styles}>
      <Phrases spec={spec.phrases} pluginManager={pluginManager} {...themeStyles} {...events} />
    </StyledP>
  );
}
