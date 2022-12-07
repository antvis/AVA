import React from 'react';

import { isCustomSection, isStandardSection } from '@antv/ava';
import { v4 } from 'uuid';
import { isFunction } from 'lodash';

import { NTV_PREFIX_CLS } from '../constants';
import { presetPluginManager } from '../chore/plugin';
import { classnames as cx } from '../../utils';
import { Paragraph } from '../paragraph';
import { Container } from '../styled';

import type { NtvTypes } from '@antv/ava';
import type { ThemeStylesProps, ExtensionProps, SectionEvents } from '../types';

type SectionProps = ThemeStylesProps &
  ExtensionProps &
  SectionEvents & {
    /**
     * @description specification of section text spec
     * @description.zh-CN Section 描述 json 信息
     */
    spec: NtvTypes.SectionSpec;
  };

export function Section({
  spec,
  size = 'normal',
  theme = 'light',
  pluginManager = presetPluginManager,
  ...events
}: SectionProps) {
  const themeStyles = { size, theme };
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
        return descriptor.render(spec, themeStyles);
      }
    }
    return null;
  };

  return (
    <Container
      as="section"
      {...themeStyles}
      className={cx(`${NTV_PREFIX_CLS}-section`, spec.className)}
      style={spec.styles}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {renderCustomSection()}
      {isStandardSection(spec) &&
        spec.paragraphs.map((p) => (
          <Paragraph key={p.key || v4()} spec={p} pluginManager={pluginManager} {...themeStyles} {...paragraphEvents} />
        ))}
    </Container>
  );
}
