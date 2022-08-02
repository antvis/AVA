import { PhrasesBuilder, getTrendDesc } from '../utils/phrases-builder';
import { TrendInfo, Language } from '../../interface';

export function trendStrategy(variableMap: TrendInfo, lang: Language) {
  const { measure, trend } = variableMap;
  const phrases = new PhrasesBuilder(lang);

  // `The ${measure} goes ${trend.desc}.`
  if (lang === 'en-US') {
    phrases.add('The');
    phrases.add(measure, 'metric_name');
    phrases.add('goes');
  }

  // `${measure}趋势${trend.desc}.`
  if (lang === 'zh-CN') {
    phrases.add(measure, 'metric_name');
  }

  phrases.add(getTrendDesc(trend, lang), 'trend_desc');
  phrases.addSymbol('punctuation_stop');

  return phrases;
}
