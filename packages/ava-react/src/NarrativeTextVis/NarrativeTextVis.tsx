import React, { useRef, useEffect } from 'react';

import { v4 } from 'uuid';

import { classnames as cx } from '../utils';

import { NTV_PREFIX_CLS } from './constants';
import { Container } from './styled';
import { Headline } from './paragraph';
import { Section } from './section';
import { presetPluginManager } from './chore/plugin';
import { copyToClipboard, getSelectionContentForCopy } from './chore/exporter';

import type { NarrativeTextVisProps } from './types';

export function NarrativeTextVis({
  spec,
  size = 'normal',
  theme = 'light',
  palette,
  pluginManager = presetPluginManager,
  showCollapse = false,
  copyNarrative,
  ...events
}: NarrativeTextVisProps) {
  const narrativeDomRef = useRef<HTMLDivElement>(null);

  const { headline, sections, styles, className } = spec;
  const themeStyles = { theme, size, palette };

  const {
    onClickNarrative,
    onMouseEnterNarrative,
    onMouseLeaveNarrative,
    onCopySuccess,
    onCopyFailure,
    ...sectionEvents
  } = events || {};

  const onClick = () => {
    onClickNarrative?.(spec);
  };

  const onMouseEnter = () => {
    onMouseEnterNarrative?.(spec);
  };

  const onMouseLeave = () => {
    onMouseLeaveNarrative?.(spec);
  };

  useEffect(() => {
    const onCopy = async (event: ClipboardEvent) => {
      const { plainText, html } = await getSelectionContentForCopy();
      if (!copyNarrative) {
        // 如果没有传递复制方法，默认行为是拦截用户复制操作(使用快捷键或右键选择复制均会触发)，将转换后的内容放进剪切板
        // if no `copyNarrative` passed in, the default behavior when user conduct `copy` is to put the transformed html and plainText into user's clipboard
        event.preventDefault();
        copyToClipboard(html, plainText, onCopySuccess, onCopyFailure);
      } else {
        copyNarrative({ spec, plainText, html });
      }
    };

    narrativeDomRef.current?.addEventListener('copy', onCopy);
    return () => {
      narrativeDomRef.current?.addEventListener('copy', onCopy);
    };
  }, [copyNarrative]);

  return (
    <Container
      className={cx(className, `${NTV_PREFIX_CLS}-container`)}
      style={styles}
      {...themeStyles}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={narrativeDomRef}
    >
      {headline ? <Headline spec={headline} pluginManager={pluginManager} {...themeStyles} {...sectionEvents} /> : null}
      {sections
        ? sections?.map((section) => (
            <Section
              key={section.key || v4()}
              spec={section}
              pluginManager={pluginManager}
              showCollapse={showCollapse}
              {...themeStyles}
              {...sectionEvents}
            />
          ))
        : null}
    </Container>
  );
}
