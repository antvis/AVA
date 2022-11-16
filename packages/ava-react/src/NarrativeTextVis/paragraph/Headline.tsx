import React from 'react';

import { Headline as StyledHeadline } from '../styled';
import { Phrases } from '../phrases';
import { getPrefixCls, classnames as cx } from '../utils';
import { presetPluginManager } from '../chore/plugin';

import type { NtvTypes } from '@antv/ava';
import type { ExtensionProps, ParagraphEvents } from '../types';

type HeadlineProps = ExtensionProps &
  ParagraphEvents & {
    spec: NtvTypes.HeadlineSpec;
  };

export function Headline({ spec, pluginManager = presetPluginManager, ...events }: HeadlineProps) {
  const { onClickParagraph, onMouseEnterParagraph, onMouseLeaveParagraph, ...phraseEvents } = events || {};
  const onClick = () => {
    onClickParagraph?.(spec);
  };
  const onMouseEnter = () => {
    onMouseEnterParagraph?.(spec);
  };
  const onMouseLeave = () => {
    onMouseLeaveParagraph?.(spec);
  };
  return (
    <StyledHeadline
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cx(getPrefixCls('headline'), spec.className)}
      style={spec.styles}
    >
      <Phrases spec={spec.phrases} pluginManager={pluginManager} {...phraseEvents} />
    </StyledHeadline>
  );
}
