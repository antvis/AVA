import { ChartID, ChartKnowledgeJSON } from '@antv/ckb';
import { AntVSpec } from '@antv/antv-spec';
import { BasicDataPropertyForAdvice, ChartRuleModule, DesignRuleModule, RuleModule } from '../../ruler/concepts/rule';
import { get, deepMix } from '../utils';
import { DataFrame } from '../utils/dataframe';
import { Advice, AdvisorOptions } from './interface';
import { getChartTypeSpec } from './spec-mapping';
import { defaultWeight } from './default-weight';

/**
 *
 * @param chartType
 * @param dataProps
 * @param options options such as purpose, preferences for 'landscape' or 'portrait'
 * @returns total score after rating by rules
 */

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

  let hardScore = 1;
  Object.values(ruleBase)
    .filter(
      (r: RuleModule) => r.type === 'HARD' && r.chartTypes.includes(chartType) && !get(ruleBase, `${r.id}.option.off`)
    )
    .forEach((hr: RuleModule) => {
      const weight = get(ruleBase, `${hr.id}.option.weight`) || defaultWeight[hr.id];
      const score = weight * (hr as ChartRuleModule).validator({ dataProps, chartType, purpose, preferences });
      hardScore *= score;
      record.push({ name: hr.id, score, hard: true });
    });

  /**
   * TODO
   * new soft rules score method
   */
  let softScore = 0;
  Object.values(ruleBase)
    .filter(
      (r: RuleModule) => r.type === 'SOFT' && r.chartTypes.includes(chartType) && !get(ruleBase, `${r.id}.option.off`)
    )
    .forEach((sr: RuleModule) => {
      const weight = get(ruleBase, `${sr.id}.option.weight`) || defaultWeight[sr.id];
      const score = weight * (sr as ChartRuleModule).validator({ dataProps, chartType, purpose, preferences });
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
      rule.type === 'DESIGN' && rule.chartTypes.indexOf(chartType) !== -1 && !get(ruleBase, `${rule.id}.option.off`)
  );
  const encodingSpec = toCheckRules.reduce((lastSpec, rule: RuleModule) => {
    const relatedSpec = (rule as DesignRuleModule).optimizer(dataProps, chartSpec);
    return deepMix(lastSpec, relatedSpec);
  }, {});
  return encodingSpec;
}

export function dataFrameToAdvices(
  chartWIKI: Record<string, ChartKnowledgeJSON>,
  ruleBase: Record<string, RuleModule>,
  dataFrame: DataFrame,
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

  const { dataProps } = dataFrame;
  // score every possible chart
  const list: Advice[] = CHART_ID_OPTIONS.map((t: string) => {
    // step 1: analyze score by rule
    const score = scoreRules(t, dataProps, ruleBase, options);
    if (score <= 0) {
      return { type: t, spec: null, score };
    }

    // step 2: field mapping to spec encoding
    const chartTypeSpec = getChartTypeSpec(t, dataFrame, chartWIKI[t]);

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
