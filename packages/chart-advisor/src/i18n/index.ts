import { en_US, zh_CN } from './locales';
import { get as _get } from 'lodash';

export type Language = 'en-US' | 'zh-CN';

let defaultLanguage: Language | undefined = undefined;

const transformLanguage = (lang: string) => {
  // If the language starts with "zh", it is "zh-CN" by default,
  if (lang && lang === 'zh-CN') return lang;
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
  get: (key: string) => {
    return _get({ en_US, zh_CN }, [getLanguage().replace('-', '_'), key], key);
  },
};
