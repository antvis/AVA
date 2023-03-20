import React from 'react';

import { cloneDeep } from 'lodash';

import { functionalize } from '../../utils';

import { createPhraseFactory } from './createPhraseFactory';

import type { EntityType, EntityMetaData } from '@antv/ava';
import type { CSSProperties } from 'react';
import type { PhraseDescriptor, SpecificEntityPhraseDescriptor, CustomEntityMode } from './plugin-protocol.type';
import type { ThemeStylesProps } from '../../types';

function getMergedDescriptor(
  defaultDescriptor: SpecificEntityPhraseDescriptor,
  customDescriptor: SpecificEntityPhraseDescriptor
) {
  const result = { ...defaultDescriptor, ...customDescriptor };
  result.encoding = { ...(defaultDescriptor?.encoding || {}), ...(customDescriptor?.encoding || {}) };
  return result;
}

export const createEntityPhraseFactory =
  (key: EntityType, defaultDescriptor: SpecificEntityPhraseDescriptor) =>
  (
    customDescriptor?: SpecificEntityPhraseDescriptor,
    mode: CustomEntityMode = 'merge'
  ): PhraseDescriptor<EntityMetaData> => {
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

      const encodingStyle = (value: string, metadata: EntityMetaData, themeStyles: ThemeStylesProps): CSSProperties => {
        const args = [value, metadata, themeStyles] as const;
        return {
          ...commonStyleFn(...args),
          color: functionalize(color, undefined)(...args),
          backgroundColor: functionalize(bgColor, undefined)(...args),
          fontSize: functionalize(fontSize, undefined)(...args),
          fontWeight: functionalize(fontWeight, undefined)(...args),
          textDecoration: functionalize(underline, false)(...args) ? 'underline' : undefined,
        };
      };
      entityDescriptor.style = encodingStyle;

      // handle content
      const { prefix, suffix, inlineChart } = entityDescriptor.encoding;
      const { content } = entityDescriptor;
      entityDescriptor.content = (...args) => {
        const [value] = args;
        return (
          <>
            {functionalize(prefix, null)(...args)}
            {content ? content(...args) : value}
            {functionalize(suffix, null)(...args)}
            {functionalize(inlineChart, null)(...args)}
          </>
        );
      };
      delete entityDescriptor.encoding;
    }

    return entityFactory<EntityMetaData>({ key, ...entityDescriptor });
  };
