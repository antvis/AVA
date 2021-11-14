import { PhrasesBuilder } from '../utils/phrases-builder';
import { LowVarianceInfo } from '../../interface';

/**
 * @template `The ${measures} data points of ${dimension} are very similar to the mean, that is, the variance is low.`
 * @example The life_expect data points of country are very similar to the mean, that is, the variance is low.
 */
export function lowVarianceStrategy(variableMap: LowVarianceInfo) {
  const { measure, dimension } = variableMap;
  const phrases = new PhrasesBuilder();
  phrases.add('The');
  phrases.add(measure, 'metric_name');
  phrases.add('data points of');
  phrases.add(dimension);
  phrases.add('are very similar to the mean');
  phrases.addSymbol('punctuation_comma');
  phrases.add('that is');
  phrases.addSymbol('punctuation_comma');
  phrases.add('the variance is low');
  phrases.addSymbol('punctuation_stop');
  return phrases;
}
