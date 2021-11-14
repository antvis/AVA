import { PhrasesBuilder } from '../utils/phrases-builder';
import { TrendInfo } from '../../interface';

/**
 * @template: `The ${measure} goes ${trend.desc}.`
 * @example: The life_expect goes increasing.
 */
export function trendStrategy(variableMap: TrendInfo) {
  const { measure, trend } = variableMap;
  const phrases = new PhrasesBuilder();
  phrases.add('The');
  phrases.add(measure, 'metric_name');
  phrases.add('goes');
  phrases.add(trend, 'trend_desc');
  phrases.addSymbol('punctuation_stop'); // .
  return phrases;
}
