import React, { CSSProperties, ReactNode } from 'react';
import { EntityMetaData, EntityType } from '@antv/narrative-text-schema';
import { cloneDeep } from 'lodash';
import { PhraseDescriptor, SpecificEntityPhraseDescriptor, CustomEntityMode } from './plugin-protocol.type';
import { createPhraseFactory } from './createPhraseFactory';
import { functionalize } from '../../utils';

export const createEntityPhraseFactory =
  (key: EntityType, defaultDescriptor: SpecificEntityPhraseDescriptor) =>
  (
    customDescriptor?: SpecificEntityPhraseDescriptor,
    mode: CustomEntityMode = 'merge',
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
      const commonStyleFn = functionalize<CSSProperties>(entityDescriptor?.style, {});

      const encodingStyle = (value: string, metadata: EntityMetaData): CSSProperties => {
        return {
          ...commonStyleFn(value, metadata),
          color: functionalize<string>(color, undefined)(value, metadata),
          backgroundColor: functionalize<string>(bgColor, undefined)(value, metadata),
          fontSize: functionalize<number | string>(fontSize, undefined)(value, metadata),
          fontWeight: functionalize<number | string>(fontWeight, undefined)(value, metadata),
          textDecoration: functionalize<boolean>(underline, false)(value, metadata) ? 'underline' : undefined,
        };
      };
      entityDescriptor.style = encodingStyle;

      // handle content
      const { prefix, suffix, inlineChart } = entityDescriptor.encoding;
      const { content } = entityDescriptor;
      entityDescriptor.content = (value: string, metadata: EntityMetaData) => (
        <>
          {functionalize<ReactNode>(prefix, null)(value, metadata)}
          {content ? content(value, metadata) : value}
          {functionalize<ReactNode>(suffix, null)(value, metadata)}
          {functionalize<ReactNode>(inlineChart, null)(value, metadata)}
        </>
      );
      delete entityDescriptor.encoding;
    }

    return entityFactory<EntityMetaData>({ key, ...entityDescriptor });
  };

function getMergedDescriptor(
  defaultDescriptor: SpecificEntityPhraseDescriptor,
  customDescriptor: SpecificEntityPhraseDescriptor,
) {
  const result = { ...defaultDescriptor, ...customDescriptor };
  result.encoding = { ...(defaultDescriptor?.encoding || {}), ...(customDescriptor?.encoding || {}) };
  return result;
}
