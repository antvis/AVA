/* eslint-disable no-template-curly-in-string */
import { generateTextSpec } from '../../../ntv';

import { InsightNarrativeStrategy } from './base';
import { getInsightName, getDefaultSeparator } from './helpers';

import type { HomogeneousInsightInfo } from './base';
import type { Language, HomogeneousPatternInfo, HomogeneousInsightType } from '../../types';
import type { ParagraphSpec, Structure } from '../../../ntv/types';

const variableMetaMap = {
  measures: {
    varType: 'metric_name',
  },
};

export default class CommonnessNarrativeStrategy extends InsightNarrativeStrategy<HomogeneousPatternInfo> {
  static readonly insightType: HomogeneousInsightType = 'commonness';

  protected static structures: Record<Language, Structure[]> = {
    'zh-CN': [
      {
        template: '大部分 ${dimensions} 的维值在 ${measures} 上具有 ${insightType}。',
        variableMetaMap,
      },
    ],
    'en-US': [
      {
        template: 'Most of the dimension values of ${dimensions} have ${insightType} on ${measures}.',
        variableMetaMap,
      },
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateTextSpec(insightInfo: HomogeneousInsightInfo, lang: Language) {
    const { measures, dimensions, insightType } = insightInfo;
    const spec = generateTextSpec({
      structures: CommonnessNarrativeStrategy.structures[lang],
      variable: {
        measures: measures.map((m) => m.fieldName).join(getDefaultSeparator(lang)),
        dimensions: dimensions.map((m) => m.fieldName).join(getDefaultSeparator(lang)),
        insightType: getInsightName(insightType, lang),
      },
    });
    return spec.sections[0].paragraphs as ParagraphSpec[];
  }
}
