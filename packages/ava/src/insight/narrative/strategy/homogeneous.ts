import { PointPatternInfo } from '../../interface';
import { HomogeneousInfo } from '../interface';
import { PhrasesBuilder } from '../utils/phrases-builder';

function setPrefix(phrases: PhrasesBuilder, subspace: HomogeneousInfo['subspace']) {
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
}

const QUANTITY_LIMIT = 6;

/**
 * @template
 * @example
 */
export function homogeneousStrategy(variableMap: HomogeneousInfo) {
  const phrases = new PhrasesBuilder();
  const { subspace, measures, breakdown, type, insightType, childPattern, commSet, exc } = variableMap;
  const hasSubspace = subspace.length > 0;

  if (hasSubspace) {
    setPrefix(phrases, subspace);
  }

  if (type === 'commonness') {
    const subjects = commSet.length > QUANTITY_LIMIT ? commSet.slice(0, QUANTITY_LIMIT - 1).concat('...') : commSet;
    subjects.forEach((item, index) => {
      phrases.add(item, 'dim_value');
      if (index < subjects.length - 2) {
        phrases.addSymbol('punctuation_comma');
      } else if (index < subjects.length - 1) {
        phrases.add('and');
      }
    });
  } else {
    phrases.add('most');
    if (measures.length > 1) {
      phrases.add('measures');
    } else {
      phrases.add(breakdown, 'metric_name');
    }
  }

  phrases.add('have a common');
  phrases.add(insightType.replace('_', ' '));

  if (insightType === 'trend' && childPattern.type === 'trend') {
    phrases.add('off');
    phrases.add(childPattern.trend);
  } else if (['change_point', 'outlier', 'time_series_outlier'].includes(insightType)) {
    phrases.add('in');
    const { x, y } = childPattern as PointPatternInfo;
    phrases.add(`${x}`, 'dim_value');
    phrases.addSymbol('punctuation_comma');
    phrases.add(`${y}`, 'metric_value');
  }

  if (type === 'exception' && exc) {
    phrases.addSymbol('punctuation_comma');
    phrases.add('except');
    exc.forEach((item, index) => {
      phrases.add(item, 'dim_value');
      if (index < exc.length - 2) {
        phrases.addSymbol('punctuation_comma');
      } else if (index === exc.length - 2) {
        phrases.add('and');
      }
    });
  }

  phrases.addSymbol('punctuation_stop');
  return phrases;
}
