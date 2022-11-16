import React from 'react';
import { HeadlineSpec } from '@antv/narrative-text-schema';
import { Headline as StyledHeadline } from '../styled';
import { Phrases } from '../phrases';
import { getPrefixCls, classnames as cx } from '../utils';
import { ExtensionProps, ParagraphEvents } from '../interface';
import { presetPluginManager } from '../chore/plugin';

type HeadlineProps = ExtensionProps &
  ParagraphEvents & {
    spec: HeadlineSpec;
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
