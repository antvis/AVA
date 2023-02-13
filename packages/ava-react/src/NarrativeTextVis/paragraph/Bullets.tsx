import React, { useState } from 'react';

import { v4 } from 'uuid';

import { Ol, Ul, Li, P as StyledP } from '../styled';
import { Phrases } from '../phrases';
import { NTV_PREFIX_CLS } from '../constants';
import { getCollapseProps } from '../utils';
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
  showCollapse = false,
  ...events
}: BulletsProps) {
  const themeStyles = { theme, size };
  const { onClickParagraph, onMouseEnterParagraph, onMouseLeaveParagraph, ...phraseEvents } = events || {};
  const collapseProps = getCollapseProps(showCollapse);
  // TODO 受控
  const [collapsed, setCollapsed] = useState(false);

  // 配置折叠属性 && 有子节点含儿子节点的才具备可折叠样式
  const collapsible = !!collapseProps && spec.bullets.some((bullet) => bullet.subBullet);

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

    const toggleCollapse = () => {
      setCollapsed(!collapsed);
    };

    return (
      <Li
        className={cx(`${NTV_PREFIX_CLS}-li`, bullet.className)}
        key={spec.key || v4()}
        style={bullet.styles}
        {...themeStyles}
        collapsible={collapsible}
        showLine={collapseProps && collapseProps.showLine}
        onClick={onClickLi}
        onMouseEnter={onMouseEnterLi}
        onMouseLeave={onMouseLeaveLi}
      >
        {bullet?.subBullet && collapseProps && (
          <span className={cx(`${NTV_PREFIX_CLS}-switcher-icon`)} onClick={toggleCollapse}>
            {collapseProps.switcherIcon(collapsed)}
          </span>
        )}
        <StyledP {...themeStyles}>
          <Phrases spec={bullet.phrases} pluginManager={pluginManager} {...themeStyles} {...phraseEvents} />
        </StyledP>
        {!collapsed && bullet?.subBullet ? (
          <Bullets
            spec={bullet?.subBullet}
            pluginManager={pluginManager}
            showCollapse={showCollapse}
            {...themeStyles}
            {...events}
          />
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
