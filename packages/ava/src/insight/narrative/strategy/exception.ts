/* eslint-disable no-template-curly-in-string */
import { generateTextSpec } from '../../../ntv';

import { InsightNarrativeStrategy } from './base';
import { getInsightName, getDefaultSeparator } from './helpers';

import type { HomogeneousInsightInfo } from './base';
import type { Language, HomogeneousPatternInfo, HomogeneousInsightType } from '../../types';
import type { ParagraphSpec, Structure, StructureTemp } from '../../../ntv/types';

const variableMetaMap = {
  measures: {
    varType: 'metric_name',
  },
  '.dim': {
    varType: 'dim_value',
  },
};

export default class ExceptionNarrativeStrategy extends InsightNarrativeStrategy<HomogeneousPatternInfo> {
  static readonly insightType: HomogeneousInsightType = 'exception';

  protected static structures: Record<Language, Structure[]> = {
    'zh-CN': [
      {
        template: '大部分 ${dimensions} 的维值在 ${measures} 上具有 ${insightType}，除了&{exceptionList}。',
        variableMetaMap,
      },
    ],
    'en-US': [
      {
        template:
          'Most of the dimension values of ${dimensions} have ${insightType} on ${measures}, except for &{exceptionList}.',
        variableMetaMap,
      },
    ],
  };

  protected static structureTemps: Record<Language, StructureTemp[]> = {
    'zh-CN': [
      {
        templateId: 'exceptionList',
        template: '${.dim}',
        useVariable: 'exceptions',
        separator: getDefaultSeparator('zh-CN'),
        variableMetaMap,
      },
    ],
    'en-US': [
      {
        templateId: 'exceptionList',
        template: '${.dim}',
        useVariable: 'exceptions',
        separator: getDefaultSeparator('en-US'),
        variableMetaMap,
      },
    ],
  };

  generateTextSpec(insightInfo: HomogeneousInsightInfo, lang: Language) {
    const { measures, dimensions, insightType, exceptions } = insightInfo;
    const spec = generateTextSpec({
      structures: ExceptionNarrativeStrategy.structures[lang],
      structureTemps: ExceptionNarrativeStrategy.structureTemps[lang],
      variable: {
        measures: measures.map((m) => m.fieldName).join(getDefaultSeparator(lang)),
        dimensions: dimensions.map((m) => m.fieldName).join(getDefaultSeparator(lang)),
        insightType: getInsightName(insightType, lang),
        exceptions: exceptions.map((dim) => ({ dim })),
      },
    });
    return spec.sections[0].paragraphs as ParagraphSpec[];
  }
}
