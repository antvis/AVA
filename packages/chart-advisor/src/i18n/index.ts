import { en_US, zh_CN } from './locales';
import { get as _get } from 'lodash';

export type Language = 'en-US' | 'zh-CN';

let defaultLanguage: Language | undefined = undefined;

export const getLanguage = () => {
  if (defaultLanguage) return defaultLanguage;
  const lang = navigator.language;
  // If the language starts with "zh", it is "zh-CN" by default,
  if (lang && lang === 'zh-CN') return lang;
  // otherwise, it will be "en_US".
  return 'en-US';
};

export const setLanguage = (language: Language | undefined) => {
  defaultLanguage = language === 'zh-CN' ? language : 'en-US';
};

export const intl = {
  get: (key: string) => {
    return _get({ en_US, zh_CN }, [getLanguage().replace('-', '_'), key], key);
  },
};
