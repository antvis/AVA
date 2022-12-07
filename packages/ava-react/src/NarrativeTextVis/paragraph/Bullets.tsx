import React from 'react';

import { v4 } from 'uuid';

import { Ol, Ul, Li } from '../styled';
import { Phrases } from '../phrases';
import { NTV_PREFIX_CLS } from '../constants';
import { classnames as cx } from '../../utils';
import { presetPluginManager } from '../chore/plugin';

import type { NtvTypes } from '@antv/ava';
import type { ThemeStylesProps, ExtensionProps, ParagraphEvents } from '../types';

type BulletsProps = ThemeStylesProps &
  ExtensionProps &
  ParagraphEvents & {
    spec: NtvTypes.BulletsParagraphSpec;
  };

// TODO 嵌套列表支持 render 自定义元素？
export function Bullets({
  spec,
  size = 'normal',
  theme = 'light',
  pluginManager = presetPluginManager,
  ...events
}: BulletsProps) {
  const themeStyles = { theme, size };
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
        className={cx(`${NTV_PREFIX_CLS}-li`, bullet.className)}
        key={spec.key || v4()}
        style={bullet.styles}
        {...themeStyles}
        onClick={onClickLi}
        onMouseEnter={onMouseEnterLi}
        onMouseLeave={onMouseLeaveLi}
      >
        <Phrases spec={bullet.phrases} pluginManager={pluginManager} {...themeStyles} {...phraseEvents} />
        {bullet?.subBullet ? (
          <Bullets spec={bullet?.subBullet} pluginManager={pluginManager} {...themeStyles} {...events} />
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
      {...themeStyles}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cx(`${NTV_PREFIX_CLS}-${tag}`, spec.className)}
      style={spec.styles}
    >
      {children}
    </Comp>
  );
}
