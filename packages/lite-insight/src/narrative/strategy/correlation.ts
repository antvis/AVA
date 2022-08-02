import { PhrasesBuilder } from '../utils/phrases-builder';
import { CorrelationInfo, Language } from '../../interface';

/**
 * @template: `There is a correlation between ${measures[0]} and ${measures[1]}.`
 * @example: There is a correlation between GDP and life_expect.
 */
export function correlationStrategy(variableMap: CorrelationInfo, lang: Language) {
  const { measures } = variableMap;
  const phrases = new PhrasesBuilder(lang);

  // There is a correlation between ${measures[0]} and ${measures[1]}.
  if (lang === 'en-US') {
    phrases.add('There is a correlation between');
    phrases.add(measures[0], 'metric_name');
    phrases.add('and');
    phrases.add(measures[1], 'metric_name');
  }

  // ${measures[0]} 和 ${measures[1]} 之间存在相关性
  if (lang === 'zh-CN') {
    phrases.add(measures[0], 'metric_name');
    phrases.add('和');
    phrases.add(measures[1], 'metric_name');
    phrases.add('之间存在相关性');
  }

  phrases.addSymbol('punctuation_stop');
  return phrases;
}
