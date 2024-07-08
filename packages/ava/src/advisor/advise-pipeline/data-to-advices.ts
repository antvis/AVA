import { cloneDeep, deepMix } from '../utils';

import { getChartTypeSpec } from './plugin/presets/spec-generator';
import { DEFAULT_COLOR } from './constants';
import { getChartTypeRecommendations } from './plugin/presets/chart-type-recommend/get-chart-Type';
import { applyTheme, applyDesignRules, applySmartColor } from './plugin/presets/spec-generator/spec-processors';
import { getDataProps, getSelectedData } from './plugin/presets/data-processors';

import type { ScoringResultForChartType, Advice, AdviseResult, ChartAdviseParams } from '../types';
import type { RuleModule } from '../ruler/types';
import type { ChartKnowledgeBase } from '../../ckb';

/**
 * @deprecated 已改造为 plugin 插件形式，之前的硬编码形式函数后续清理掉
 * recommending charts given data and dataProps, based on CKB and RuleBase
 *
 * @param params input params for charts recommending
 * @param ckb Chart knowledge base
 * @param ruleBase rule base
 * @returns chart list [ { type: chartTypes, spec: antv-spec, score: >0 }, ... ]
 */
export function dataToAdvices({
  adviseParams,
  ckb,
  ruleBase,
}: {
  adviseParams: ChartAdviseParams;
  ckb: ChartKnowledgeBase;
  ruleBase: Record<string, RuleModule>;
}): AdviseResult {
  const { data: originalData, dataProps: customDataProps, smartColor, options, colorOptions, fields } = adviseParams;
  const { refine = false, requireSpec = true, theme } = options || {};
  const { themeColor = DEFAULT_COLOR, colorSchemeType, simulationType } = colorOptions || {};

  // step0: process data
  const copyData = cloneDeep(originalData);
  const dataProps = getDataProps(copyData, fields, customDataProps);
  const filteredData = getSelectedData({ data: copyData, fields });

  // step 1: recommend chart type
  const chartTypeRecommendations: ScoringResultForChartType[] = getChartTypeRecommendations({
    dataProps,
    ruleBase,
    chartWiki: ckb,
  });

  const list: Advice[] = chartTypeRecommendations.map((result) => {
    // step 2: generate spec for each chart type
    const { score, chartType } = result;
    const chartTypeSpec = getChartTypeSpec({
      chartType,
      data: filteredData,
      dataProps,
      chartKnowledge: ckb[chartType],
    });

    // step 3: apply spec processors such as design rules, theme, color, to improve spec
    if (chartTypeSpec && refine) {
      const partEncSpec = applyDesignRules(chartType, dataProps, ruleBase, chartTypeSpec);
      deepMix(chartTypeSpec, partEncSpec);
    }

    // step 4: custom theme
    if (chartTypeSpec) {
      if (theme && !smartColor) {
        const partEncSpec = applyTheme(dataProps, chartTypeSpec, theme);
        deepMix(chartTypeSpec, partEncSpec);
      } else if (smartColor) {
        const partEncSpec = applySmartColor(dataProps, chartTypeSpec, themeColor, colorSchemeType, simulationType);
        deepMix(chartTypeSpec, partEncSpec);
      }
    }

    return { type: chartType, spec: chartTypeSpec, score };
  });

  const resultList = list.filter((advice) => (requireSpec ? advice.spec : true));

  const result = {
    advices: resultList,
    log: chartTypeRecommendations,
  };

  return result;
}
