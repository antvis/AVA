import React from 'react';

import { Tooltip, TooltipProps } from 'antd';
import { isTextPhrase, isEntityPhrase, isEscapePhrase, isFormulaPhrase, isImagePhrase } from '@antv/ava';
import { isFunction, kebabCase, isEmpty, isNil } from 'lodash';
import katex from 'katex';

import { NTV_PREFIX_CLS } from '../constants';
import { Entity, Bold, Italic, Underline, FormulaWrapper } from '../styled';
import { functionalize } from '../utils';
import { classnames as cx } from '../../utils';
import { PhraseDescriptor, presetPluginManager } from '../chore/plugin';
import { getThemeColor } from '../theme';

import type { ReactNode } from 'react';
import type { PhraseSpec, EntityPhraseSpec, CustomPhraseSpec } from '@antv/ava';
import type { ThemeStylesProps, ExtensionProps, PhraseEvents } from '../types';

type PhraseProps = ThemeStylesProps &
  ExtensionProps &
  PhraseEvents & {
    spec: PhraseSpec;
  };

function renderPhraseByDescriptor({
  spec,
  descriptor,
  themeStyles,
  events,
}: {
  spec: EntityPhraseSpec | CustomPhraseSpec;
  descriptor: PhraseDescriptor<any>;
  themeStyles: ThemeStylesProps;
  events: PhraseEvents;
}) {
  const { value = '', metadata = {}, styles: specStyles = {} } = spec;
  const { theme = 'light' } = themeStyles;
  const {
    overwrite,
    classNames,
    style: descriptorStyle,
    onHover,
    tooltip,
    onClick,
    content = () => value,
  } = descriptor || {};

  const handleClick = () => {
    onClick?.(spec?.value, metadata, themeStyles);
    events?.onClickPhrase?.(spec);
  };

  const handleMouseEnter = () => {
    onHover?.(spec?.value, metadata, themeStyles);
    events?.onMouseEnterPhrase?.(spec);
  };
  const handleMouseLeave = () => {
    events?.onMouseLeavePhrase?.(spec);
  };

  let defaultNode: ReactNode = (
    <Entity
      {...themeStyles}
      style={{
        ...functionalize(descriptorStyle, {})(spec?.value, metadata as any, themeStyles),
        ...specStyles,
      }}
      className={cx(
        `${NTV_PREFIX_CLS}-value`,
        isEntityPhrase(spec) ? `${NTV_PREFIX_CLS}-${kebabCase(spec.metadata.entityType)}` : '',
        ...functionalize(classNames, [])(spec?.value, metadata as any, themeStyles)
      )}
    >
      {content(value, metadata, themeStyles)}
    </Entity>
  );
  if (isFunction(overwrite)) {
    defaultNode = overwrite(defaultNode, value, metadata, themeStyles);
  }

  const nodeWithEvents: ReactNode =
    !isEmpty(events) || isFunction(onClick) || isFunction(onHover) ? (
      <span onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {defaultNode}
      </span>
    ) : (
      defaultNode
    );

  const showTooltip = tooltip && (tooltip?.title(value, metadata, themeStyles) as TooltipProps['title']);
  return !isNil(showTooltip) ? (
    <Tooltip
      color={theme === 'dark' ? 'white' : undefined}
      {...tooltip}
      overlayInnerStyle={theme === 'dark' ? { color: getThemeColor('colorBase', 'light') } : undefined}
      title={showTooltip}
    >
      {nodeWithEvents}
    </Tooltip>
  ) : (
    nodeWithEvents
  );
}

/** <Phrase /> can use independence */
export const Phrase: React.FC<PhraseProps> = ({
  spec: phrase,
  size = 'normal',
  theme = 'light',
  pluginManager = presetPluginManager,
  ...events
}) => {
  const themeStyles = { size, theme };

  const onClick = () => {
    events?.onClickPhrase?.(phrase);
  };

  const onMouseEnter = () => {
    events?.onMouseEnterPhrase?.(phrase);
  };

  const onMouseLeave = () => {
    events?.onMouseLeavePhrase?.(phrase);
  };

  let defaultText = !isEmpty(events) ? (
    <span onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {phrase.value}
    </span>
  ) : (
    <>{phrase.value}</>
  );

  if (isTextPhrase(phrase)) {
    if (phrase.bold) defaultText = <Bold>{defaultText}</Bold>;
    if (phrase.italic) defaultText = <Italic>{defaultText}</Italic>;
    if (phrase.underline) defaultText = <Underline>{defaultText}</Underline>;
    if (phrase.url)
      defaultText = (
        <a target="_blank" rel="noreferrer" href={phrase.url}>
          {defaultText}
        </a>
      );
    return (
      <span style={phrase?.styles} className={cx(phrase?.className)}>
        {defaultText}
      </span>
    );
  }

  // use pre to render escape character
  // 使用 pre 标签渲染特殊转义字符
  if (isEscapePhrase(phrase))
    return (
      <pre className={cx(phrase.className)} style={phrase.styles}>
        {phrase.value}
      </pre>
    );

  // use katex to render formula
  // 使用 katex 渲染公式
  if (isFormulaPhrase(phrase))
    return (
      <FormulaWrapper
        className={cx(phrase.className, `${NTV_PREFIX_CLS}-formula`)}
        style={phrase.styles}
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(phrase.value, {
            throwOnError: false,
            displayMode: true,
            strict: 'ignore',
            fleqn: true,
          }),
        }}
      />
    );

  if (isImagePhrase(phrase)) {
    return <img src={phrase.value} alt={phrase.alt} className={cx(phrase.className)} style={phrase.styles} />;
  }

  const descriptor = pluginManager?.getPhraseDescriptorBySpec(phrase);
  if (descriptor) {
    return <>{renderPhraseByDescriptor({ spec: phrase, descriptor, themeStyles, events })}</>;
  }

  return defaultText;
};
