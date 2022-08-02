import { PhrasesBuilder } from '../utils/phrases-builder';
import { PointPatternInfo, Language } from '../../interface';

/**
 * @template ``
 * @example There are 4 outliers in total, which are (Afghanistan, 7.0685), (Rwanda, 5.9169), (Nigeria, 5.322) and (Kenya, 4.959).
 */
export function outliersStrategy(variableMaps: PointPatternInfo[], lang: Language) {
  const phrases = new PhrasesBuilder(lang);
  const total = variableMaps.length;

  // There are ${outliers.length} outliers in total, which are ${outliersPositionsString}.
  if (lang === 'en-US') {
    phrases.add('There are');
    phrases.add(`${total}`, 'other_metric_value');
    phrases.add('outliers in total');
    phrases.addSymbol('punctuation_comma');
    phrases.add('which are');
    phrases.add('that is');
  }

  //  总共有${outliers.length}个异常值，分别是${outliersPositionsString}。
  if (lang === 'zh-CN') {
    phrases.add('总共有');
    phrases.add(`${total}`, 'other_metric_value', { rightSpace: true });
    phrases.add('个异常值');
    phrases.addSymbol('punctuation_comma');
    phrases.add('分别是');
  }

  if (Array.isArray(variableMaps)) {
    variableMaps?.forEach((outlier, index) => {
      const { x, y } = outlier;
      phrases.addSymbol('punctuation_left_parentheses');
      phrases.add(`${x}`, 'dim_value');
      phrases.addSymbol('punctuation_comma');
      phrases.add(`${y}`, 'metric_value');
      phrases.addSymbol('punctuation_right_parentheses');

      if (index < total - 2) {
        phrases.addSymbol('punctuation_comma');
      } else if (index === total - 2) {
        phrases.add(lang === 'zh-CN' ? '和' : 'and');
      }
    });
  }

  phrases.addSymbol('punctuation_stop');

  return phrases;
}
