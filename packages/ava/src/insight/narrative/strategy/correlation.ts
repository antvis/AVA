/* eslint-disable no-template-curly-in-string */
import { generateTextSpec } from '../../../ntv';

import { InsightNarrativeStrategy } from './base';

import type { InsightType, Language, InsightInfo, CorrelationInfo } from '../../types';
import type { ParagraphSpec, Structure } from '../../../ntv/types';

const variableMetaMap = {
  pcorr: {
    varType: 'metric_value',
  },
  m1: {
    varType: 'metric_value',
  },
  m2: {
    varType: 'metric_value',
  },
};

export default class CorrelationNarrativeStrategy extends InsightNarrativeStrategy<CorrelationInfo> {
  static readonly insightType: InsightType = 'correlation';

  protected static structures: Record<Language, Structure[]> = {
    'zh-CN': [
      {
        template: '${m1} 与 ${m2} 相关性最大，相关系数为 ${pcorr}。',
        variableMetaMap,
      },
    ],
    'en-US': [
      {
        template: '${m1} is most correlated with ${m2} with a correlation coefficient of ${pcorr}.',
        variableMetaMap,
      },
    ],
  };

  generateTextSpec(insightInfo: InsightInfo<CorrelationInfo>, lang: Language) {
    const { patterns } = insightInfo;
    const {
      measures: [m1, m2],
      pcorr,
    } = patterns[0];
    const spec = generateTextSpec({
      structures: CorrelationNarrativeStrategy.structures[lang],
      variable: {
        m1,
        m2,
        pcorr,
      },
    });

    return spec.sections[0].paragraphs as ParagraphSpec[];
  }
}
