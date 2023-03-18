/* eslint-disable no-template-curly-in-string */
import { generateTextSpec } from '../../../ntv';

import { InsightNarrativeStrategy } from './base';

import type { InsightType, Language, InsightInfo, LowVarianceInfo } from '../../types';
import type { ParagraphSpec, Structure } from '../../../ntv/types';

const variableMetaMap = {
  measure: {
    varType: 'metric_name',
  },
  mean: {
    varType: 'metric_value',
  },
};

export default class LowVarianceNarrativeStrategy extends InsightNarrativeStrategy<LowVarianceInfo> {
  static readonly insightType: InsightType = 'low_variance';

  protected static structures: Record<Language, Structure[]> = {
    'zh-CN': [
      {
        template: '按照 ${dimension} 对 ${measure} 进行拆解，指标分布均匀，平均为 ${mean}。',
        variableMetaMap,
      },
    ],
    'en-US': [
      {
        template:
          'The quantity is disassembled according to ${dimension}, and ${measure} are evenly distributed, with an average of ${mean}.',
        variableMetaMap,
      },
    ],
  };

  generateTextSpec(insightInfo: InsightInfo<LowVarianceInfo>, lang: Language) {
    const { patterns } = insightInfo;
    const { dimension, measure, mean } = patterns[0];
    const spec = generateTextSpec({
      structures: LowVarianceNarrativeStrategy.structures[lang],
      variable: {
        dimension,
        measure,
        mean,
      },
    });

    return spec.sections[0].paragraphs as ParagraphSpec[];
  }
}
