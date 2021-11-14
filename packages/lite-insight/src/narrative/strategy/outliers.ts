import { PhrasesBuilder } from '../utils/phrases-builder';
import { PointPatternInfo } from '../../interface';

/**
 * @template `There are ${outliers.length} outliers in total, which are ${outliersPositionsString}.`
 * @example There are 4 outliers in total, which are (Afghanistan, 7.0685), (Rwanda, 5.9169), (Nigeria, 5.322) and (Kenya, 4.959).
 */
export function outliersStrategy(variableMaps: PointPatternInfo[]) {
  const phrases = new PhrasesBuilder();
  const total = variableMaps.length;

  phrases.add('There are');
  phrases.add(`${total}`);
  phrases.add('outliers in total');
  phrases.addSymbol('punctuation_comma');
  phrases.add('which are');
  phrases.add('that is');

  variableMaps.forEach((outlier, index) => {
    const { x, y } = outlier;
    phrases.addSymbol('punctuation_left_parentheses');
    phrases.add(`${x}`, 'dim_value');
    phrases.addSymbol('punctuation_comma');
    phrases.add(`${y}`, 'metric_value');
    phrases.addSymbol('punctuation_right_parentheses');

    if (index < total - 2) {
      phrases.addSymbol('punctuation_comma');
    } else if (index === total - 2) {
      phrases.add('and');
    }
  });

  phrases.addSymbol('punctuation_stop');

  return phrases;
}
