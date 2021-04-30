import { zh_CN, en_US } from './locales';
import { get as _get } from 'lodash';

function getLanguage() {
  const lang = navigator.language;
  // If the language starts with "zh", it is "zh_CN" by default,
  if (lang && lang === 'zh-CN') return 'zh_CN';
  // otherwise, it will be "en_US".
  return 'en_US';
}

export const intl = {
  get: (key: string) => {
    return _get({ zh_CN, en_US }, [getLanguage(), key], key);
  },
};
