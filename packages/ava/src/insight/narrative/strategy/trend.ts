/* eslint-disable no-template-curly-in-string */
import { first, last } from 'lodash';

import { generateTextSpec } from '../../../ntv';

import { InsightNarrativeStrategy } from './base';

import type { InsightType, Language, InsightInfo, TrendInfo, TrendType } from '../../types';
import type { ParagraphSpec, Structure } from '../../../ntv/types';

const trendMapping: Record<TrendType, string> = {
  decreasing: '下降',
  increasing: '上升',
  'no trend': '无明显趋势。',
};

const variableMetaMap = {
  dateRange: {
    varType: 'time_desc',
  },
  trend: {
    varType: 'trend_desc',
  },
  measure: {
    varType: 'metric_name',
  },
};

export default class TrendNarrativeStrategy extends InsightNarrativeStrategy<TrendInfo> {
  static readonly insightType: InsightType = 'trend';

  protected static structures: Record<Language, Structure[]> = {
    'zh-CN': [
      {
        template: '${dateRange}，${measure}${trend}。',
        variableMetaMap,
      },
    ],
    'en-US': [
      {
        template: 'In ${dateRange}, the ${measure} goes ${trend}.',
        variableMetaMap,
      },
    ],
  };

  generateTextSpec(insightInfo: InsightInfo<TrendInfo>, lang: Language) {
    const { patterns, data } = insightInfo;
    const { dimension, measure, trend } = patterns[0];
    const spec = generateTextSpec({
      structures: TrendNarrativeStrategy.structures[lang],
      variable: {
        dateRange: `${first(data)[dimension]}~${last(data)[dimension]}`,
        measure,
        trend: lang === 'en-US' ? trend : trendMapping[trend],
      },
    });

    return spec.sections[0].paragraphs as ParagraphSpec[];
  }
}
