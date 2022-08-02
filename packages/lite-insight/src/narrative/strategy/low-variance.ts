import { PhrasesBuilder } from '../utils/phrases-builder';
import { LowVarianceInfo, Language } from '../../interface';

/**
 * @template ``
 * @example The life_expect data points of country are very similar to the mean, that is, the variance is low.
 */
export function lowVarianceStrategy(variableMap: LowVarianceInfo, lang: Language) {
  const { measure, dimension } = variableMap;
  const phrases = new PhrasesBuilder(lang);

  // The ${measures} data points of ${dimension} are very similar to the mean, that is, the variance is low.
  if (lang === 'en-US') {
    phrases.add('The');
    phrases.add(measure, 'metric_name');
    phrases.add('data points of');
    phrases.add(dimension);
    phrases.add('are very similar to the mean');
    phrases.addSymbol('punctuation_comma');
    phrases.add('that is');
    phrases.addSymbol('punctuation_comma');
    phrases.add('the variance is low');
  }

  // ${dimension} 的 ${measures} 数据点与均值非常相似，即方差较低。
  if (lang === 'zh-CN') {
    phrases.add(dimension);
    phrases.add('的');
    phrases.add(measure, 'metric_name');
    phrases.add('数据点与均值非常相似');
    phrases.addSymbol('punctuation_comma');
    phrases.add('即方差较低');
  }

  phrases.addSymbol('punctuation_stop');

  return phrases;
}
