import { PhrasesBuilder } from '../utils/phrases-builder';
import { ChangePointInfo, Language } from '../../interface';

export function changePointStrategy(variableMaps: ChangePointInfo[], lang: Language) {
  const phrases = new PhrasesBuilder(lang);
  const total = variableMaps?.length;

  // `There are ${changePoints.length} abrupt changes in total, which occur in ${changePointsPositionsString}.`
  if (lang === 'en-US') {
    phrases.add('There are');
    phrases.add(`${total}`);
    phrases.add('abrupt changes in total');
    phrases.addSymbol('punctuation_comma');
    phrases.add('which occur in');
    phrases.add('that is');
  }

  // 总共有 ${changePoints.length} 个突变，发生在 ${changePointsPositionsString}。
  if (lang === 'zh-CN') {
    phrases.add('总共有');
    phrases.add(`${total}`);
    phrases.add('个突变');
    phrases.addSymbol('punctuation_comma');
    phrases.add('发生在');
  }

  if (Array.isArray(variableMaps)) {
    variableMaps.forEach((point, index) => {
      const { y } = point;
      phrases.add(`${y}`, 'metric_value');
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
