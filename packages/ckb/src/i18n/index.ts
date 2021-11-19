import { zhCN } from './zh-CN';
import { TranslateList } from './interface';

/**
 * Language Code
 * @public
 */
export type Language = 'en-US' | 'zh-CN';

export const translateMapping: Record<Language, TranslateList | null> = {
  'en-US': null,
  'zh-CN': zhCN,
};

/**
 * Get TranslateList of specific language except English.
 *
 * @param lang Language code
 * @returns TranslateList or null
 */
export function I18N(lang?: Language) {
  if (lang && Object.keys(translateMapping).includes(lang)) {
    return translateMapping[lang];
  }

  return null;
}
