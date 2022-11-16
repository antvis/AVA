import React, { useRef, useEffect } from 'react';
import { NarrativeTextSpec } from '@antv/narrative-text-schema';
import { v4 } from 'uuid';
import { isHotkey } from 'is-hotkey';
import { Container } from './styled';
import { Headline } from './paragraph';
import { Section } from './section';
import { ThemeProps, ExtensionProps, NarrativeEvents } from './interface';
import { classnames as cx, getPrefixCls, elementContainsSelection } from './utils';
import { presetPluginManager } from './chore/plugin';
import { copyToClipboard, getSelectionContentForCopy } from './chore/exporter/helpers/copy';

export type NarrativeTextVisProps = ThemeProps &
  ExtensionProps &
  NarrativeEvents & {
    /**
     * @description specification of narrative text spec
     * @description.zh-CN Narrative 描述 json 信息
     */
    spec: NarrativeTextSpec;
    /**
     * @description the function to be called when copy event is listened. If it is undefined, the default behavior is to put the transformed html and plain text into user's clipboard
     * @description.监听到 copy 事件时执行的函数，可用于控制复制的内容和复制行为，如果不传，默认将会把转换后的富文本和纯文本内容放入剪切板
     */
    copyNarrative?: (content: {spec: NarrativeTextSpec, plainText: string, html: string}) => void;
  };

export function NarrativeTextVis({
  spec,
  size = 'normal',
  pluginManager = presetPluginManager,
  copyNarrative,
  ...events
}: NarrativeTextVisProps) {
  const narrativeDomRef = useRef<HTMLDivElement>(null);
  const { headline, sections, styles, className } = spec;
  const { onClickNarrative, onMouseEnterNarrative, onMouseLeaveNarrative, onCopySuccess, onCopyFailure, ...sectionEvents } = events || {};
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
      const {plainText, html } = await getSelectionContentForCopy()
      if(!copyNarrative) {
         // 如果没有传递复制方法，默认行为是拦截用户复制操作(使用快捷键或右键选择复制均会触发)，将转换后的内容放进剪切板
         // if no `copyNarrative` passed in, the default behavior when user conduct `copy` is to put the transformed html and plainText into user's clipboard
        event.preventDefault();
        copyToClipboard(html, plainText, onCopySuccess, onCopyFailure);
      } else {
        copyNarrative({spec, plainText, html})
      }
    }

    narrativeDomRef.current?.addEventListener('copy', onCopy);
    return () => {
      narrativeDomRef.current?.addEventListener('copy', onCopy);
    };
  }, [copyNarrative])

  return (
    <Container
      size={size}
      className={cx(className, getPrefixCls('container'))}
      style={styles}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={narrativeDomRef}
    >
      {headline ? <Headline spec={headline} pluginManager={pluginManager} {...sectionEvents} /> : null}
      {sections
        ? sections?.map((section) => (
            <Section
              key={section.key || v4()}
              size={size}
              spec={section}
              pluginManager={pluginManager}
              {...sectionEvents}
            />
          ))
        : null}
    </Container>
  );
}
