import React, { ReactNode } from 'react';
import { Tooltip } from 'antd';
import {
  PhraseSpec,
  EntityPhraseSpec,
  CustomPhraseSpec,
  isTextPhrase,
  isEntityPhrase,
} from '@antv/narrative-text-schema';
import { isFunction, kebabCase, isEmpty, isNil } from 'lodash';
import { Entity, Bold, Italic, Underline } from '../styled';
import { getPrefixCls, classnames as cx, functionalize } from '../utils';
import { ThemeProps, ExtensionProps, PhraseEvents } from '../interface';
import { PhraseDescriptor, presetPluginManager } from '../chore/plugin';

type PhraseProps = ThemeProps &
  ExtensionProps &
  PhraseEvents & {
    spec: PhraseSpec;
  };

function renderPhraseByDescriptor(
  spec: EntityPhraseSpec | CustomPhraseSpec,
  descriptor: PhraseDescriptor<any>,
  theme: ThemeProps,
  events: PhraseEvents,
) {
  const { value = '', metadata = {}, styles: specStyles = {} } = spec;
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
    onClick?.(spec?.value, metadata);
    events?.onClickPhrase?.(spec);
  };

  const handleMouseEnter = () => {
    onHover?.(spec?.value, metadata);
    events?.onMouseEnterPhrase?.(spec);
  };
  const handleMouseLeave = () => {
    events?.onMouseLeavePhrase?.(spec);
  };

  let defaultNode: ReactNode = (
    <Entity
      {...theme}
      style={{
        ...functionalize(descriptorStyle, {})(spec?.value, metadata as any),
        ...specStyles,
      }}
      className={cx(
        getPrefixCls('value'),
        isEntityPhrase(spec) ? getPrefixCls(kebabCase(spec.metadata.entityType)) : '',
        ...functionalize(classNames, [])(spec?.value, metadata as any),
      )}
    >
      {content(value, metadata)}
    </Entity>
  );
  if (isFunction(overwrite)) {
    defaultNode = overwrite(defaultNode, value, metadata);
  }

  const nodeWithEvents =
    !isEmpty(events) || isFunction(onClick) || isFunction(onHover) ? (
      <span onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {defaultNode}
      </span>
    ) : (
      defaultNode
    );

  const showTooltip = tooltip && tooltip?.title(value, metadata);
  return !isNil(showTooltip) ? (
    <Tooltip {...tooltip} title={showTooltip}>
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
  pluginManager = presetPluginManager,
  ...events
}) => {
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
    return defaultText;
  }

  const descriptor = pluginManager?.getPhraseDescriptorBySpec(phrase);
  if (descriptor) {
    return <>{renderPhraseByDescriptor(phrase, descriptor, { size }, events)}</>;
  }

  return defaultText;
};
