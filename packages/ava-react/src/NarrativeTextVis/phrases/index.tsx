import React from 'react';

import { presetPluginManager } from '../chore/plugin';

import { Phrase } from './Phrase';

import type { PhraseSpec } from '@antv/ava';
import type { ThemeStylesProps, ExtensionProps, PhraseEvents } from '../types';

type PhrasesProps = ThemeStylesProps &
  Pick<ExtensionProps, 'pluginManager'> &
  PhraseEvents & {
    /**
     * @description specification of phrase text spec
     * @description.zh-CN 短语描述 json 信息
     */
    spec: PhraseSpec[];
  };

export function Phrases({
  spec,
  size = 'normal',
  theme = 'light',
  palette,
  pluginManager = presetPluginManager,
  ...events
}: PhrasesProps) {
  const themeStyles = { theme, size, palette };
  return (
    <>
      {spec?.map((phrase, index) => {
        const key = `${index}-${phrase.value}`;
        return (
          <Phrase key={phrase.key || key} spec={phrase} pluginManager={pluginManager} {...themeStyles} {...events} />
        );
      })}
    </>
  );
}

export { Phrase } from './Phrase';
