import React from 'react';
import { BulletsParagraphSpec } from '@antv/narrative-text-schema';
import { v4 } from 'uuid';
import { Ol, Ul, Li } from '../styled';
import { Phrases } from '../phrases';
import { getPrefixCls, classnames as cx } from '../utils';
import { ThemeProps, ExtensionProps, ParagraphEvents } from '../interface';
import { presetPluginManager } from '../chore/plugin';

type BulletsProps = ThemeProps &
  ExtensionProps &
  ParagraphEvents & {
    spec: BulletsParagraphSpec;
  };

export function Bullets({ spec, size = 'normal', pluginManager = presetPluginManager, ...events }: BulletsProps) {
  const { onClickParagraph, onMouseEnterParagraph, onMouseLeaveParagraph, ...phraseEvents } = events || {};

  const children = spec.bullets?.map((bullet) => {
    const onClickLi = () => {
      onClickParagraph?.(bullet);
    };
    const onMouseEnterLi = () => {
      onMouseEnterParagraph?.(bullet);
    };
    const onMouseLeaveLi = () => {
      onMouseLeaveParagraph?.(bullet);
    };
    return (
      <Li
        className={cx(getPrefixCls('li'), bullet.className)}
        key={spec.key || v4()}
        style={bullet.styles}
        onClick={onClickLi}
        onMouseEnter={onMouseEnterLi}
        onMouseLeave={onMouseLeaveLi}
      >
        <Phrases spec={bullet.phrases} size={size} pluginManager={pluginManager} {...phraseEvents} />
        {bullet?.subBullet ? (
          <Bullets spec={bullet?.subBullet} size={size} pluginManager={pluginManager} {...events} />
        ) : null}
      </Li>
    );
  });

  const tag = spec.isOrder ? 'ol' : 'ul';
  const Comp = spec.isOrder ? Ol : Ul;

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
    <Comp
      as={tag}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      size={size}
      className={cx(getPrefixCls(tag), spec.className)}
      style={spec.styles}
    >
      {children}
    </Comp>
  );
}
