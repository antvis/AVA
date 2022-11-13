import React from 'react';

import { cloneDeep } from 'lodash';

import { functionalize } from '../../../utils';

import { createPhraseFactory } from './createPhraseFactory';

import type { NtvTypes } from '@antv/ava';
import type { CSSProperties } from 'react';
import type { PhraseDescriptor, SpecificEntityPhraseDescriptor, CustomEntityMode } from './plugin-protocol.type';

function getMergedDescriptor(
  defaultDescriptor: SpecificEntityPhraseDescriptor,
  customDescriptor: SpecificEntityPhraseDescriptor
) {
  const result = { ...defaultDescriptor, ...customDescriptor };
  result.encoding = { ...(defaultDescriptor?.encoding || {}), ...(customDescriptor?.encoding || {}) };
  return result;
}

export const createEntityPhraseFactory =
  (key: NtvTypes.EntityType, defaultDescriptor: SpecificEntityPhraseDescriptor) =>
  (
    customDescriptor?: SpecificEntityPhraseDescriptor,
    mode: CustomEntityMode = 'merge'
  ): PhraseDescriptor<NtvTypes.EntityMetaData> => {
    const entityFactory = createPhraseFactory(true);

    let entityDescriptor = cloneDeep(defaultDescriptor);
    if (customDescriptor) {
      entityDescriptor =
        mode === 'overwrite' ? customDescriptor : getMergedDescriptor(defaultDescriptor, customDescriptor);
    }

    // transfer entity descriptor to common descriptor
    if (entityDescriptor.encoding) {
      // handle style
      const { color, bgColor, fontSize, fontWeight, underline } = entityDescriptor.encoding;
      const commonStyleFn = functionalize(entityDescriptor?.style, {});

      const encodingStyle = (value: string, metadata: NtvTypes.EntityMetaData): CSSProperties => {
        return {
          ...commonStyleFn(value, metadata),
          color: functionalize(color, undefined)(value, metadata),
          backgroundColor: functionalize(bgColor, undefined)(value, metadata),
          fontSize: functionalize(fontSize, undefined)(value, metadata),
          fontWeight: functionalize(fontWeight, undefined)(value, metadata),
          textDecoration: functionalize(underline, false)(value, metadata) ? 'underline' : undefined,
        };
      };
      entityDescriptor.style = encodingStyle;

      // handle content
      const { prefix, suffix, inlineChart } = entityDescriptor.encoding;
      const { content } = entityDescriptor;
      entityDescriptor.content = (value: string, metadata: NtvTypes.EntityMetaData) => (
        <>
          {functionalize(prefix, null)(value, metadata)}
          {content ? content(value, metadata) : value}
          {functionalize(suffix, null)(value, metadata)}
          {functionalize(inlineChart, null)(value, metadata)}
        </>
      );
      delete entityDescriptor.encoding;
    }

    return entityFactory<NtvTypes.EntityMetaData>({ key, ...entityDescriptor });
  };
