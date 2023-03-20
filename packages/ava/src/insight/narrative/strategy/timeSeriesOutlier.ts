/* eslint-disable no-template-curly-in-string */
import { first, last, maxBy, minBy } from 'lodash';

import { generateTextSpec } from '../../../ntv';

import { InsightNarrativeStrategy } from './base';
import { getDiffDesc } from './helpers';

import type { InsightType, Language, InsightInfo, TimeSeriesOutlierInfo } from '../../types';
import type { ParagraphSpec, Structure } from '../../../ntv/types';

const variableMetaMap = {
  dateRange: {
    varType: 'time_desc',
  },
  measure: {
    varType: 'metric_name',
  },
  max: {
    varType: 'metric_value',
  },
  min: {
    varType: 'metric_value',
  },
  total: {
    varType: 'metric_value',
  },
  '.x': {
    varType: 'dim_value',
  },
  '.y': {
    varType: 'metric_value',
  },
  '.base': {
    varType: 'metric_value',
  },
  '.diff': {
    varType: 'delta_value',
  },
};

export default class TimeSeriesOutlierNarrativeStrategy extends InsightNarrativeStrategy<TimeSeriesOutlierInfo> {
  static readonly insightType: InsightType = 'time_series_outlier';

  protected static structures: Record<Language, Structure[]> = {
    'zh-CN': [
      {
        template:
          '${dateRange}，${measure} 波动范围为最大值 ${max}, 最小值 ${min}，有 ${total} 个异常点，按超过基线大小排序如下：',
        variableMetaMap,
      },
      {
        template: '${.x}，${measure} 为 ${.y}, 相比基线（${.base}）${.diffDesc} ${.diff}。',
        displayType: 'bullet',
        bulletOrder: true,
        useVariable: 'outliers',
        variableMetaMap,
      },
    ],
    'en-US': [
      {
        template:
          'In ${dateRange}, ${measure} fluctuates within the range of ${max} to ${min}, with ${total} outliers, sorted by size above the baseline as follows.',
        variableMetaMap,
      },
      {
        template: '${.x}, ${measure} for ${.y}, compared to the baseline value ${.base}, ${.diffDesc} ${.diff}.',
        displayType: 'bullet',
        bulletOrder: true,
        useVariable: 'outliers',
        variableMetaMap,
      },
    ],
  };

  generateTextSpec(insightInfo: InsightInfo<TimeSeriesOutlierInfo>, lang: Language) {
    const { patterns, data } = insightInfo;
    const { measure } = patterns[0];

    const spec = generateTextSpec({
      structures: TimeSeriesOutlierNarrativeStrategy.structures[lang],
      variable: {
        dateRange: `${first(patterns).x}~${last(patterns).x}`,
        total: patterns.length,
        measure,
        max: maxBy(data, measure)[measure],
        min: minBy(data, measure)[measure],
        outliers: patterns.map((point, index) => {
          const base = point.baselines[index];
          const diff = point.y - base;
          return {
            ...point,
            base,
            diffDesc: getDiffDesc(diff, lang),
            diff,
          };
        }),
      },
    });

    return spec.sections[0].paragraphs as ParagraphSpec[];
  }
}
