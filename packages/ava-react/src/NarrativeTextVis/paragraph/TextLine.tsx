import React from 'react';
import { TextParagraphSpec } from '@antv/narrative-text-schema';
import { P as StyledP } from '../styled';
import { Phrases } from '../phrases';
import { getPrefixCls, classnames as cx } from '../utils';
import { ThemeProps, ExtensionProps, PhraseEvents } from '../interface';
import { presetPluginManager } from '../chore/plugin';

type TextLineProps = ThemeProps &
  ExtensionProps &
  PhraseEvents & {
    spec: TextParagraphSpec;
  };

export function TextLine({ spec, size = 'normal', pluginManager = presetPluginManager, ...events }: TextLineProps) {
  return (
    <StyledP size={size} className={cx(getPrefixCls('p'), spec.className)} style={spec.styles}>
      <Phrases spec={spec.phrases} size={size} pluginManager={pluginManager} {...events} />
    </StyledP>
  );
}
