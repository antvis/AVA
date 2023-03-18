/* eslint-disable no-template-curly-in-string */
import { generateTextSpec } from '../../../ntv';

import { InsightNarrativeStrategy } from './base';
import { getDefaultSeparator } from './helpers';

import type { InsightType, Language, InsightInfo, CategoryOutlierInfo } from '../../types';
import type { ParagraphSpec, Structure, StructureTemp } from '../../../ntv/types';

const variableMetaMap = {
  measure: {
    varType: 'metric_name',
  },
  total: {
    varType: 'metric_value',
  },
  '.x': {
    varType: 'dim_value',
  },
};

export default class CategoryOutlierNarrativeStrategy extends InsightNarrativeStrategy<CategoryOutlierInfo> {
  static readonly insightType: InsightType = 'category_outlier';

  protected static structures: Record<Language, Structure[]> = {
    'zh-CN': [
      {
        template: '${measure} 在 ${dimension} 上有 ${total} 个类别相比其他维值突出：&{outliers}。',
        variableMetaMap,
      },
    ],
    'en-US': [
      {
        template:
          '${measure} has ${total} categories in the ${dimension} that are prominent compared to other dimensions: &{outliers}.',
        variableMetaMap,
      },
    ],
  };

  protected static structureTemps: Record<Language, StructureTemp[]> = {
    'zh-CN': [
      {
        templateId: 'outliers',
        template: '${.x}',
        separator: getDefaultSeparator('zh-CN'),
        variableMetaMap,
        useVariable: 'patterns',
      },
    ],
    'en-US': [
      {
        templateId: 'outliers',
        template: '${.x}',
        separator: getDefaultSeparator('en-US'),
        variableMetaMap,
        useVariable: 'patterns',
      },
    ],
  };

  generateTextSpec(insightInfo: InsightInfo<CategoryOutlierInfo>, lang: Language) {
    const { patterns } = insightInfo;
    const { dimension, measure } = patterns[0];
    const spec = generateTextSpec({
      structures: CategoryOutlierNarrativeStrategy.structures[lang],
      variable: {
        dimension,
        measure,
        total: patterns.length,
        patterns,
      },
      structureTemps: CategoryOutlierNarrativeStrategy.structureTemps[lang],
    });

    return spec.sections[0].paragraphs as ParagraphSpec[];
  }
}
