import _upperFirst from 'lodash/upperFirst';

import { PhrasesBuilder, getInsightTypeDesc } from '../utils/phrases-builder';
import { SubjectsDescInfo } from '../interface';
import { Language } from '../../interface';

/**
 * case 1: has subspace
 * @template `For (${item.value}(${item.dimension})) ${insightSubjects} appearing in ${measure}(${measureAggMethod}) by ${breakdown}`
 * @example For (2005(year)), outlier appearing in fertility(MEAN) by country
 *
 * case 2: no subspaces
 * @template `${insightSubjects} appearing in ${measure}(${measureAggMethod}) by ${breakdown}`
 * @example Trend appearing in life_expect(MEAN) by year
 */
export function subjectsDescStrategy(variableMap: SubjectsDescInfo, lang: Language) {
  const { subspace, insightTypes, measure, measureMethod, breakdown } = variableMap;
  const phrases = new PhrasesBuilder(lang);
  const hasSubspace = subspace.length > 0;

  if (hasSubspace) {
    phrases.add(lang === 'zh-CN' ? '对于' : 'For');
    phrases.addSymbol('punctuation_left_parentheses'); // (

    subspace.forEach((item, index) => {
      phrases.add(item.value, 'dim_value');
      phrases.addSymbol('punctuation_left_parentheses'); // (
      phrases.add(item.dimension);
      phrases.addSymbol('punctuation_right_parentheses'); // )
      if (index < subspace.length - 1) {
        phrases.addSymbol('punctuation_comma'); // ,
      }
    });

    phrases.addSymbol('punctuation_right_parentheses'); // )

    phrases.addSymbol('punctuation_comma');
  }

  // ${insightSubjects} appearing in ${measure}(${measureAggMethod}) by ${breakdown}`
  if (lang === 'en-US') {
    insightTypes.forEach((type, index) => {
      let insightType = getInsightTypeDesc(type, lang);
      if (index === 0 && !hasSubspace) {
        insightType = _upperFirst(insightType);
      }
      phrases.add(insightType);
      if (index < insightTypes.length - 2) {
        phrases.addSymbol('punctuation_comma');
      } else if (index === insightTypes.length - 2) {
        phrases.add('and');
      }
    });

    phrases.add('appearing in');
    phrases.add(measure);
    phrases.addSymbol('punctuation_left_parentheses'); // (
    phrases.add(measureMethod);
    phrases.addSymbol('punctuation_right_parentheses'); // )
    phrases.add('by');
    phrases.add(breakdown);
  }

  // 按${breakdown}下钻，life_expect(MEAN) 中出现的趋势
  if (lang === 'zh-CN') {
    phrases.add('按');
    phrases.add(breakdown);
    phrases.add('下钻');
    phrases.addSymbol('punctuation_comma');
    phrases.add(measure);
    phrases.addSymbol('punctuation_left_parentheses'); // (
    phrases.add(measureMethod);
    phrases.addSymbol('punctuation_right_parentheses'); // )
    phrases.add('存在');
    insightTypes.forEach((type, index) => {
      phrases.add(getInsightTypeDesc(type, lang));
      if (index < insightTypes.length - 2) {
        phrases.addSymbol('punctuation_comma');
      } else if (index === insightTypes.length - 2) {
        phrases.add('和');
      }
    });
  }

  phrases.addSymbol('punctuation_stop');

  return phrases;
}
