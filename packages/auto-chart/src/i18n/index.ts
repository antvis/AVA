/* eslint-disable camelcase */
import { en_US, zh_CN } from './locales';

export const locales = {
  'zh-CN': zh_CN,
  'en-US': en_US,
};

export type Language = keyof typeof locales;

export const intl = {
  get: (key: string, language?: Language) => {
    return locales[language || 'zh-CN'][key];
  },
};
