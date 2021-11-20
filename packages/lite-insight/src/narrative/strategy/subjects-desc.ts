import _upperFirst from 'lodash/upperFirst';
import { PhrasesBuilder } from '../utils/phrases-builder';
import { SubjectsDescInfo } from '../interface';

/**
 * case 1: has subspace
 * @template `For (${item.value}(${item.dimension})) ${insightSubjects} appearing in ${measure}(${measureAggMethod}) by ${breakdown}`
 * @example For (2005(year)), outlier appearing in fertility(MEAN) by country
 *
 * case 2: no subspaces
 * @template `${insightSubjects} appearing in ${measure}(${measureAggMethod}) by ${breakdown}`
 * @example Trend appearing in life_expect(MEAN) by year
 */
export function subjectsDescStrategy(variableMap: SubjectsDescInfo) {
  const { subspace, insightTypes, measure, measureMethod, breakdown } = variableMap;
  const phrases = new PhrasesBuilder();
  const hasSubspace = subspace.length > 0;

  if (hasSubspace) {
    phrases.add('For');
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

  insightTypes.forEach((type, index) => {
    let insightType = type.replace('_', ' ');
    if (index === 0 && !hasSubspace) insightType = _upperFirst(insightType);
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
  return phrases;
}
