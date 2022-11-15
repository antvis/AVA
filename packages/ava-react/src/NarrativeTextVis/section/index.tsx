import React from 'react';

import { isCustomSection, isStandardSection } from '@antv/ava';
import { v4 } from 'uuid';
import { isFunction } from 'lodash';

import { presetPluginManager } from '../chore/plugin';
import { getPrefixCls, classnames as cx } from '../../utils';
import { Paragraph } from '../paragraph';
import { Container } from '../styled';

import type { NtvTypes } from '@antv/ava';
import type { ThemeProps, ExtensionProps, SectionEvents } from '../types';

type SectionProps = ThemeProps &
  ExtensionProps &
  SectionEvents & {
    /**
     * @description specification of section text spec
     * @description.zh-CN Section 描述 json 信息
     */
    spec: NtvTypes.SectionSpec;
  };

export function Section({ spec, size = 'normal', pluginManager = presetPluginManager, ...events }: SectionProps) {
  const { onClickSection, onMouseEnterSection, onMouseLeaveSection, ...paragraphEvents } = events || {};
  const onClick = () => {
    onClickSection?.(spec);
  };
  const onMouseEnter = () => {
    onMouseEnterSection?.(spec);
  };
  const onMouseLeave = () => {
    onMouseLeaveSection?.(spec);
  };
  const renderCustomSection = () => {
    if (isCustomSection(spec)) {
      const descriptor = pluginManager.getBlockDescriptor(spec.customType);
      if (descriptor && isFunction(descriptor?.render)) {
        return descriptor.render(spec);
      }
    }
    return null;
  };
  return (
    <Container
      size={size}
      as="section"
      className={cx(getPrefixCls('section'), spec.className)}
      style={spec.styles}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {renderCustomSection()}
      {isStandardSection(spec) &&
        spec.paragraphs.map((p) => (
          <Paragraph key={p.key || v4()} spec={p} size={size} pluginManager={pluginManager} {...paragraphEvents} />
        ))}
    </Container>
  );
}
