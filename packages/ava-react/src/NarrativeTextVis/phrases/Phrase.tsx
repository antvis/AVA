import React from 'react';

import { Tooltip, TooltipProps } from 'antd';
import { isTextPhrase, isEntityPhrase } from '@antv/ava';
import { isFunction, kebabCase, isEmpty, isNil } from 'lodash';

import { NTV_PREFIX_CLS } from '../constants';
import { Entity, Bold, Italic, Underline } from '../styled';
import { functionalize } from '../utils';
import { classnames as cx } from '../../utils';
import { PhraseDescriptor, presetPluginManager } from '../chore/plugin';

import type { ReactNode } from 'react';
import type { NtvTypes } from '@antv/ava';
import type { ThemeProps, ExtensionProps, PhraseEvents } from '../types';

type PhraseProps = ThemeProps &
  ExtensionProps &
  PhraseEvents & {
    spec: NtvTypes.PhraseSpec;
  };

function renderPhraseByDescriptor(
  spec: NtvTypes.EntityPhraseSpec | NtvTypes.CustomPhraseSpec,
  descriptor: PhraseDescriptor<any>,
  theme: ThemeProps,
  events: PhraseEvents
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
        `${NTV_PREFIX_CLS}-value`,
        isEntityPhrase(spec) ? `${NTV_PREFIX_CLS}-${kebabCase(spec.metadata.entityType)}` : '',
        ...functionalize(classNames, [])(spec?.value, metadata as any)
      )}
    >
      {content(value, metadata)}
    </Entity>
  );
  if (isFunction(overwrite)) {
    defaultNode = overwrite(defaultNode, value, metadata);
  }

  const nodeWithEvents: ReactNode =
    !isEmpty(events) || isFunction(onClick) || isFunction(onHover) ? (
      <span onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {defaultNode}
      </span>
    ) : (
      defaultNode
    );

  const showTooltip = tooltip && (tooltip?.title(value, metadata) as TooltipProps['title']);
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
