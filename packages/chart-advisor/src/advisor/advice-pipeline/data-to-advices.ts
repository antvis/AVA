import { ChartID, ChartKnowledgeJSON } from '@antv/ckb';
import { AntVSpec } from '@antv/antv-spec';
import { BasicDataPropertyForAdvice, ChartRuleModule, DesignRuleModule, RuleModule } from '../../ruler/concepts/rule';
import { deepMix } from '../utils';
import { Advice, AdvisorOptions, DataRows } from './interface';
import { getChartTypeSpec } from './spec-mapping';
import { defaultWeight } from './default-weight';

/**
 *
 * @param chartType chart ID to be score
 * @param dataProps data props of the input data
 * @param ruleBase rule base
 * @param options
 * @returns
 */
const scoreRules = (
  chartType: ChartID | string,
  dataProps: BasicDataPropertyForAdvice[],
  ruleBase: Record<string, RuleModule>,
  options?: AdvisorOptions
) => {
  const showLog = options?.showLog;
  const purpose = options ? options.purpose : '';
  const preferences = options ? options.preferences : undefined;

  // for log
  const record: Record<string, any>[] = [];
  const info = { dataProps, chartType, purpose, preferences };
  let hardScore = 1;
  Object.values(ruleBase)
    .filter((r: RuleModule) => r.type === 'HARD' && r.trigger(info) && !ruleBase[r.id].option?.off)
    .forEach((hr: RuleModule) => {
      const weight = ruleBase[hr.id].option?.weight || defaultWeight[hr.id];
      const score = weight * (hr as ChartRuleModule).validator(info);
      hardScore *= score;
      record.push({ name: hr.id, score, hard: true });
    });

  let softScore = 0;
  Object.values(ruleBase)
    .filter((r: RuleModule) => r.type === 'SOFT' && r.trigger(info) && !ruleBase[r.id].option?.off)
    .forEach((sr: RuleModule) => {
      const weight = ruleBase[sr.id].option?.weight || defaultWeight[sr.id];
      const score = weight * (sr as ChartRuleModule).validator(info);
      softScore += score;
      record.push({ name: sr.id, score, hard: false });
    });
  // const score = hardScore * 100 * (softFullScore ? softScore / softFullScore : 0);
  const score = hardScore * (1 + softScore);

  if (showLog) console.log('💯score: ', score, '=', hardScore, '* (1 +', softScore, ') ;charttype: ', chartType);
  if (showLog) console.log(record);
  return score;
};

function applyDesignRules(
  chartType: string,
  dataProps: BasicDataPropertyForAdvice[],
  ruleBase: Record<string, RuleModule>,
  chartSpec: AntVSpec
) {
  const toCheckRules = Object.values(ruleBase).filter(
    (rule: RuleModule) =>
      rule.type === 'DESIGN' && rule.trigger({ dataProps, chartType }) && !ruleBase[rule.id].option?.off
  );
  const encodingSpec = toCheckRules.reduce((lastSpec, rule: RuleModule) => {
    const relatedSpec = (rule as DesignRuleModule).optimizer(dataProps, chartSpec);
    return deepMix(lastSpec, relatedSpec);
  }, {});
  return encodingSpec;
}

/**
 * recommending charts given data and dataProps, based on CKB and RuleBase
 * @param data input data [ {a: xxx, b: xxx}, ... ]
 * @param dataProps data props derived from data-wizard or customized by users
 * @param chartWIKI ckb
 * @param ruleBase rule base
 * @param options options for advising such as log, preferences
 * @returns chart list [ { type: chartTypes, spec: antv-spec, score: >0 }, ... ]
 */
export function dataToAdvices(
  data: DataRows,
  dataProps: BasicDataPropertyForAdvice[],
  chartWIKI: Record<string, ChartKnowledgeJSON>,
  ruleBase: Record<string, RuleModule>,
  options?: AdvisorOptions
) {
  /**
   * `refine`: whether to apply design rules
   */
  const enableRefine = options?.refine === undefined ? false : options.refine;
  /**
   * `showLog`: log on/off
   */
  const showLog = options?.showLog;
  /**
   * customized CKB input or default CKB from @antv/ckb
   */
  const ChartWIKI = chartWIKI;
  /**
   * all charts that can be recommended
   * */
  const CHART_ID_OPTIONS = Object.keys(ChartWIKI);

  // score every possible chart
  const list: Advice[] = CHART_ID_OPTIONS.map((t: string) => {
    // step 1: analyze score by rule
    const score = scoreRules(t, dataProps, ruleBase, options);
    if (score <= 0) {
      return { type: t, spec: null, score };
    }

    // step 2: field mapping to spec encoding
    const chartTypeSpec = getChartTypeSpec(t, data, dataProps, chartWIKI[t]);

    // FIXME kpi_panel and table spec to be null temporarily
    const customChartType = ['kpi_panel', 'table'];
    if (!customChartType.includes(t) && !chartTypeSpec) return { type: t, spec: null, score: 0 };

    // step 3: apply design rules
    if (chartTypeSpec && enableRefine) {
      const partEncSpec = applyDesignRules(t, dataProps, ruleBase, chartTypeSpec);
      deepMix(chartTypeSpec.layer[0], partEncSpec);
    }

    return { type: t, spec: chartTypeSpec, score };
  });

  /**
   * compare two advice charts by their score
   * @param chart1
   * @param chart2
   * @returns
   */
  function compareAdvices(chart1: Advice, chart2: Advice) {
    if (chart1.score < chart2.score) {
      return 1;
    }
    if (chart1.score > chart2.score) {
      return -1;
    }
    return 0;
  }

  // filter and sorter
  const resultList = list.filter((e) => e.score > 0 && e.spec).sort(compareAdvices);

  if (showLog) console.log('🍒🍒🍒🍒🍒🍒 resultList 🍒🍒🍒🍒🍒🍒');
  if (showLog) console.log(resultList);

  return resultList;
}
