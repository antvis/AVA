import { rulesDoc as base } from './rulesdoc';
import { zh_CN } from './i18n/zh-CN';
import { cloneDeep } from 'lodash';

export type Lang = 'zh-CN' | 'en-US';

export function rulesDoc(lang: Lang = 'en-US') {
  const rulesDoc = cloneDeep(base);

  if (lang === 'zh-CN') {
    Object.keys(rulesDoc).forEach((key) => {
      const doc = rulesDoc[key];
      if (zh_CN[key]) {
        doc['intro'] = zh_CN[key]['intro'];
        doc['description'] = zh_CN[key]['description'];
      }
    });
  }

  return rulesDoc;
}
