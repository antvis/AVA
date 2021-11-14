import { PhrasesBuilder } from '../utils/phrases-builder';
import { MajorityInfo } from '../../interface';

/**
 * @template: `For ${dimension}, ${x} accounts for the majority of ${measure}.`
 * @example: For Gram_Staining, negative accounts for the majority of Penicillin.
 */
export function majorityStrategy(variableMap: MajorityInfo) {
  const { dimension, x, measure } = variableMap;
  const phrases = new PhrasesBuilder();
  phrases.add('For');
  phrases.add(dimension);
  phrases.addSymbol('punctuation_comma'); // ,
  phrases.add(`${x}`, 'dim_value');
  phrases.add('accounts for the majority of');
  phrases.add(measure);
  phrases.addSymbol('punctuation_stop'); // .
  return phrases;
}
