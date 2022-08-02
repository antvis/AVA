import { PointPatternInfo, Language } from '../../interface';
import { HomogeneousInfo } from '../interface';
import { PhrasesBuilder, getInsightTypeDesc, getTrendDesc } from '../utils/phrases-builder';

function setPrefix(phrases: PhrasesBuilder, subspace: HomogeneousInfo['subspace'], lang: Language) {
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
}

const QUANTITY_LIMIT = 6;

/**
 * @template
 * @example
 */
export function homogeneousStrategy(variableMap: HomogeneousInfo, lang: Language) {
  const phrases = new PhrasesBuilder(lang);
  const { subspace, measures, breakdown, type, insightType, childPattern, commSet, exc } = variableMap;
  const hasSubspace = subspace.length > 0;

  if (hasSubspace) {
    setPrefix(phrases, subspace, lang);
  }

  if (type === 'commonness') {
    const subjects = commSet.length > QUANTITY_LIMIT ? commSet.slice(0, QUANTITY_LIMIT - 1).concat('...') : commSet;
    subjects.forEach((item, index) => {
      phrases.add(item, 'dim_value');
      if (index < subjects.length - 2) {
        phrases.addSymbol('punctuation_comma');
      } else if (index < subjects.length - 1) {
        phrases.add(lang === 'zh-CN' ? '和' : 'and');
      }
    });
  } else {
    phrases.add(lang === 'zh-CN' ? '大多数' : 'most');
    if (measures.length > 1) {
      phrases.add(lang === 'zh-CN' ? '指标' : 'measures');
    } else {
      phrases.add(breakdown, 'metric_name');
    }
  }

  phrases.add(lang === 'zh-CN' ? '有相同的' : 'have a common');
  phrases.add(getInsightTypeDesc(insightType, lang));

  if (insightType === 'trend' && childPattern.type === 'trend') {
    if (lang === 'en-US') phrases.add('of');
    phrases.add(getTrendDesc(childPattern.trend, lang), 'trend_desc');
  } else if (['change_point', 'outlier', 'time_series_outlier'].includes(insightType)) {
    if (lang === 'en-US') phrases.add('in');
    const { x, y } = childPattern as PointPatternInfo;
    phrases.add(`${x}`, 'dim_value');
    phrases.addSymbol('punctuation_comma');
    phrases.add(`${y}`, 'metric_value');
  }

  // except，yyy 和 zzz
  // 除了，xxx，yyy 和 zzz
  if (type === 'exception' && exc) {
    phrases.addSymbol('punctuation_comma');
    phrases.add(lang === 'zh-CN' ? '除了' : 'except');
    exc.forEach((item, index) => {
      phrases.add(item, 'dim_value');
      if (index < exc.length - 2) {
        phrases.addSymbol('punctuation_comma');
      } else if (index === exc.length - 2) {
        phrases.add(lang === 'zh-CN' ? '和' : 'and');
      }
    });
  }

  phrases.addSymbol('punctuation_stop');
  return phrases;
}
