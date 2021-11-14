import { PhrasesBuilder } from '../utils/phrases-builder';
import { ChangePointInfo } from '../../interface';

/**
 * @template `There are ${changePoints.length} abrupt changes in total, which occur in ${changePointsPositionsString}.`
 * @example
 */
export function changePointStrategy(variableMaps: ChangePointInfo[]) {
  const phrases = new PhrasesBuilder();
  const total = variableMaps.length;

  phrases.add('There are');
  phrases.add(`${total}`);
  phrases.add('abrupt changes in total');
  phrases.addSymbol('punctuation_comma');
  phrases.add('which occur in');
  phrases.add('that is');

  variableMaps.forEach((point, index) => {
    const { y } = point;
    phrases.add(`${y}`, 'metric_value');
    if (index < total - 2) {
      phrases.addSymbol('punctuation_comma');
    } else if (index === total - 2) {
      phrases.add('and');
    }
  });

  phrases.addSymbol('punctuation_stop');
  return phrases;
}
