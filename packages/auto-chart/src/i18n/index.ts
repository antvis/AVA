/* eslint-disable camelcase */
import { get as _get } from 'lodash';
import { en_US, zh_CN } from './locales';

export type Language = 'en-US' | 'zh-CN';

let defaultLanguage: Language;

const transformLanguage = (language: string) => {
  // If the language starts with "zh", it is "zh-CN" by default,
  if (language && language === 'zh-CN') return language;
  // otherwise, it will be "en_US".
  return 'en-US';
};

export const getLanguage = () => {
  if (defaultLanguage) return defaultLanguage;
  return transformLanguage(navigator.language);
};

// set the default language
export const setLanguage = (language: Language | undefined) => {
  defaultLanguage = language === 'zh-CN' || 'en-US' ? language : transformLanguage(navigator.language);
};

export const intl = {
  get: (key: string, language?: string) => {
    return _get(
      { en_US, zh_CN },
      [language ? transformLanguage(language).replace('-', '_') : getLanguage().replace('-', '_'), key],
      key
    );
  },
};
