import { PhrasesBuilder } from '../utils/phrases-builder';
import { MajorityInfo, Language } from '../../interface';

/**
 * @template: ``
 * @example: For Gram_Staining, negative accounts for the majority of Penicillin.
 */
export function majorityStrategy(variableMap: MajorityInfo, lang: Language) {
  const { dimension, x, measure } = variableMap;
  const phrases = new PhrasesBuilder(lang);

  // For ${dimension}, ${x} accounts for the majority of ${measure}.
  if (lang === 'en-US') {
    phrases.add('For');
    phrases.add(dimension);
    phrases.addSymbol('punctuation_comma');
    phrases.add(`${x}`, 'dim_value');
    phrases.add('accounts for the majority of');
    phrases.add(measure);
  }

  // 对于${dimension}，${x}占${measure} 的大部分。
  if (lang === 'zh-CN') {
    phrases.add('对于');
    phrases.add(dimension);
    phrases.addSymbol('punctuation_comma');
    phrases.add(`${x}`, 'dim_value');
    phrases.add('占');
    phrases.add(measure);
    phrases.add('的大部分');
  }

  phrases.addSymbol('punctuation_stop');
  return phrases;
}
