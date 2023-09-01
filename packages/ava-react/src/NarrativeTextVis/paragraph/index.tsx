import React from 'react';

import { isCustomParagraph, isHeadingParagraph, isTextParagraph, isBulletParagraph } from '@antv/ava';

import { Heading } from './Heading';
import { TextLine } from './TextLine';
import { Bullets } from './Bullets';

import type { ParagraphSpec } from '@antv/ava';
import type { ThemeStylesProps, ExtensionProps, ParagraphEvents } from '../types';

export type ParagraphProps = ThemeStylesProps &
  ExtensionProps &
  ParagraphEvents & {
    /**
     * @description specification of paragraph text spec
     * @description.zh-CN 段落描述 json 信息
     */
    spec: ParagraphSpec;
  };

export function Paragraph({ spec, pluginManager, size = 'normal', theme = 'light', ...events }: ParagraphProps) {
  const themeStyles = { size, theme };
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

  let content = null;

  if (isCustomParagraph(spec)) {
    const descriptor = pluginManager.getBlockDescriptor(spec.customType);
    if (descriptor && descriptor?.render) content = descriptor.render(spec, themeStyles);
  }

  if (isHeadingParagraph(spec)) {
    content = <Heading spec={spec} pluginManager={pluginManager} {...themeStyles} {...phraseEvents} />;
  }

  if (isTextParagraph(spec)) {
    content = <TextLine spec={spec} pluginManager={pluginManager} {...themeStyles} {...phraseEvents} />;
  }

  if (isBulletParagraph(spec)) {
    content = <Bullets spec={spec} pluginManager={pluginManager} {...themeStyles} {...events} />;
  }

  return (
    content && (
      <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {content}
      </div>
    )
  );
}

export { Headline } from './Headline';
