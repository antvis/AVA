import { PhrasesBuilder } from '../utils/phrases-builder';
import { CorrelationInfo } from '../../interface';

/**
 * @template: `There is a correlation between ${measures[0]} and ${measures[1]}.`
 * @example: There is a correlation between GDP and life_expect.
 */
export function correlationStrategy(variableMap: CorrelationInfo) {
  const { measures } = variableMap;
  const phrases = new PhrasesBuilder();
  phrases.add('There is a correlation between');
  phrases.add(measures[0], 'metric_name');
  phrases.add('and');
  phrases.add(measures[1], 'metric_name');
  phrases.addSymbol('punctuation_stop');
  return phrases;
}
