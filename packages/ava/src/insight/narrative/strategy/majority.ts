/* eslint-disable no-template-curly-in-string */
import { sumBy } from 'lodash';

import { generateTextSpec } from '../../../ntv';

import { InsightNarrativeStrategy } from './base';

import type { InsightType, Language, InsightInfo, MajorityInfo } from '../../types';
import type { ParagraphSpec, Structure } from '../../../ntv/types';

const variableMetaMap = {
  measure: {
    varType: 'metric_name',
  },
  total: {
    varType: 'metric_value',
  },
  proportion: {
    varType: 'proportion',
  },
  dimValue: {
    varType: 'dim_value',
  },
  y: {
    varType: 'metric_value',
  },
};

export default class MajorityNarrativeStrategy extends InsightNarrativeStrategy<MajorityInfo> {
  static readonly insightType: InsightType = 'majority';

  protected static structures: Record<Language, Structure[]> = {
    'zh-CN': [
      {
        template:
          '按照 ${dimension} 对 ${measure} 进行拆解，${dimValue} 的 ${measure} 显著高于其他维值，为 ${y}, 占总数（${total}）的 ${proportion}。',
        variableMetaMap,
      },
    ],
    'en-US': [
      {
        template:
          'Breaking down the ${measure} by ${dimension}, the ${measure} for ${dimValue} is significantly higher than the other dimensions, at ${y}, ${proportion} of the total (${total}).',
        variableMetaMap,
      },
    ],
  };

  generateTextSpec(insightInfo: InsightInfo<MajorityInfo>, lang: Language) {
    const { patterns, data } = insightInfo;
    const { dimension, measure, x, y } = patterns[0];
    const total = sumBy(data, measure);
    const spec = generateTextSpec({
      structures: MajorityNarrativeStrategy.structures[lang],
      variable: {
        dimension,
        measure,
        dimValue: x,
        y,
        total,
        proportion: y / total,
      },
    });

    return spec.sections[0].paragraphs as ParagraphSpec[];
  }
}
