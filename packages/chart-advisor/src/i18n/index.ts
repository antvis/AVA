import { zh_CN, en_US } from './locales';
import { get as _get } from 'lodash';

export function getLanguage() {
  const lang = navigator.language;
  // If the language starts with "zh", it is "zh-CN" by default,
  if (lang && lang === 'zh-CN') return lang;
  // otherwise, it will be "en_US".
  return 'en-US';
}

export const intl = {
  get: (key: string) => {
    return _get({ zh_CN, en_US }, [getLanguage().replace('-', '_'), key], key);
  },
};
