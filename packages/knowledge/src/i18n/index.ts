import { zhCN } from './zh-CN';
import { TranslateList } from './interface';

/**
 * @beta
 */
export type Language = 'en-US' | 'zh-CN';

export const translateMapping: Record<Language, TranslateList | null> = {
  'en-US': null,
  'zh-CN': zhCN,
};

export function I18N(lang?: Language) {
  if (lang && Object.keys(translateMapping).includes(lang)) {
    return translateMapping[lang];
  }

  return null;
}
