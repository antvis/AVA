import { zhCN } from './zh-CN';
import { CkbDictionary, I18nLanguage } from './types';

/**
 * Mapping from languages to translation lists.
 *
 * 从语言类型到翻译表的映射
 */
const translateMapping: Record<I18nLanguage, CkbDictionary | null> = {
  'zh-CN': zhCN,
};

/**
 * Get CKB dictionary of specific language except English.
 *
 * 得到除英文外的所有语言词汇表
 *
 * @param lang i18n Language code
 * @returns TranslateList or null
 */
export function ckbDict(lang: I18nLanguage): CkbDictionary {
  if (!lang || !Object.keys(translateMapping).includes(lang)) {
    throw new Error(`No CKB Dictionary for lang code ${lang}!`);
  }

  return translateMapping[lang];
}
