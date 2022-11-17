import React from 'react';

import { presetPluginManager } from '../chore/plugin';

import { Phrase } from './Phrase';

import type { NtvTypes } from '@antv/ava';
import type { ThemeProps, ExtensionProps, PhraseEvents } from '../types';

type PhrasesProps = ThemeProps &
  ExtensionProps &
  PhraseEvents & {
    /**
     * @description specification of phrase text spec
     * @description.zh-CN 短语描述 json 信息
     */
    spec: NtvTypes.PhraseSpec[];
  };

export function Phrases({ spec, size = 'normal', pluginManager = presetPluginManager, ...events }: PhrasesProps) {
  return (
    <>
      {spec?.map((phrase, index) => {
        const key = `${index}-${phrase.value}`;
        return <Phrase key={phrase.key || key} size={size} spec={phrase} pluginManager={pluginManager} {...events} />;
      })}
    </>
  );
}

export { Phrase } from './Phrase';
