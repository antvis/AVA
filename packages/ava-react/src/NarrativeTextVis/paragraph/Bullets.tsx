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

  if (!spec.bullets) return null;
  // 配置折叠属性 && 有孙子节点的才可折叠，只有儿子的不用显示折叠属性
  const collapsible = !!collapseProps && spec.bullets.some((bullet) => bullet.subBullet);
  // 儿子节点均含有 key 的时候表示可以受控
  const collapseControlled = !!collapseProps && spec.bullets.every((bullet) => bullet.key);

  const [collapsedKeys, setCollapsedKeys] = useState<string[]>(
    (collapseControlled && collapseProps && collapseProps?.collapsedKeys) || []
  );

  const children = spec.bullets.map((bullet, index) => {
    const collapseKey = bullet.key || `${index}`;
    const collapsed = collapsedKeys.includes(collapseKey);
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
      let newCollapsedKeys: string[] = [...collapsedKeys];
      if (collapsed) {
        newCollapsedKeys = newCollapsedKeys.filter((i) => i !== collapseKey);
      } else {
        newCollapsedKeys.push(collapseKey);
      }
      // 只有当用户指定 key 的时候折叠受控才生效
      if (bullet.key && collapseProps && collapseProps.onCollapsed) {
        collapseProps.onCollapsed(newCollapsedKeys);
      }
      setCollapsedKeys(newCollapsedKeys);
    };

    return (
      <Li
        key={bullet.key || v4()}
        className={cx(`${NTV_PREFIX_CLS}-li`, bullet.className)}
        style={bullet.styles}
        {...themeStyles}
        collapsible={collapsible}
        showBulletsLine={collapseProps && collapseProps.showBulletsLine}
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
