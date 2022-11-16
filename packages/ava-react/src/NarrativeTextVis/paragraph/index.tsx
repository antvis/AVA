import React from 'react';
import {
  ParagraphSpec,
  isCustomParagraph,
  isHeadingParagraph,
  isTextParagraph,
  isBulletParagraph,
} from '@antv/narrative-text-schema';

import { Heading } from './Heading';
import { TextLine } from './TextLine';
import { Bullets } from './Bullets';
import { ThemeProps, ExtensionProps, ParagraphEvents } from '../interface';

type ParagraphProps = ThemeProps &
  ExtensionProps &
  ParagraphEvents & {
    /**
     * @description specification of paragraph text spec
     * @description.zh-CN 段落描述 json 信息
     */
    spec: ParagraphSpec;
  };

export function Paragraph({ spec, pluginManager, size = 'normal', ...events }: ParagraphProps) {
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
    if (descriptor && descriptor?.render) content = descriptor.render(spec);
  }
  if (isHeadingParagraph(spec)) {
    content = <Heading spec={spec} pluginManager={pluginManager} {...phraseEvents} />;
  }
  if (isTextParagraph(spec)) {
    content = <TextLine spec={spec} size={size} pluginManager={pluginManager} {...phraseEvents} />;
  }
  if (isBulletParagraph(spec)) {
    content = <Bullets spec={spec} size={size} pluginManager={pluginManager} {...events} />;
  }
  return content ? (
    <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {content}
    </div>
  ) : null;
}

export { Headline } from './Headline';
