import { ChartID, CKBJson } from '@antv/knowledge';
import { deepMix } from '@antv/util';
import { Dataset } from '@antv/dw-util';
import { ChartRules, DesignRules, Rule, ChartRuleConfigMap, BasicDataPropertyForAdvice } from '../rules';
import _get from 'lodash/get';
import { getChartTypeSpec } from './spec-mapping';
import { AdvisorOptions, Advice, SingleViewSpec } from './interface';
import { customChartType } from '../custom-plot';

function scoreRules(chartType: ChartID, dataProps: BasicDataPropertyForAdvice[], options?: AdvisorOptions) {
  const showLog = options?.showLog;
  const purpose = options ? options.purpose : '';
  const preferences = options ? options.preferences : undefined;
  const chartRuleConfigs: ChartRuleConfigMap = options?.chartRuleConfigs || {};

  const ChartRules = initChartRules(options?.chartKnowledge);

  // for log
  const record: Record<string, any>[] = [];

  let hardScore = 1;
  ChartRules.filter(
    (r: Rule) =>
      r.hardOrSoft === 'HARD' && r.specChartTypes.includes(chartType) && !_get(chartRuleConfigs, `${r.id}.off`)
  ).forEach((hr: Rule) => {
    const customConfigs = _get(chartRuleConfigs, `${hr.id}`) || {};
    const score = hr.check({ dataProps, chartType, purpose, preferences, ...customConfigs });
    hardScore *= score;
    record.push({ name: hr.id, score, hard: true });
  });

  /**
   * TODO
   * new soft rules score method
   */
  let softScore = 0;
  // let softFullScore = 0;
  ChartRules.filter(
    (r: Rule) =>
      r.hardOrSoft === 'SOFT' && r.specChartTypes.includes(chartType) && !_get(chartRuleConfigs, `${r.id}.off`)
  ).forEach((sr: Rule) => {
    const customConfigs = _get(chartRuleConfigs, `${sr.id}`) || {};
    // const weight = _get(chartRuleConfigs, `${sr.id}.weight`) || sr.weight;
    // softFullScore += weight * 1;

    const score = sr.check({ dataProps, chartType, purpose, preferences, ...customConfigs });
    softScore += score;
    record.push({ name: sr.id, score, hard: false });
  });
  // const score = hardScore * 100 * (softFullScore ? softScore / softFullScore : 0);
  const score = hardScore * (1 + softScore);

  if (showLog) console.log('💯score: ', score, '=', hardScore, '* (1 +', softScore, ') ;charttype: ', chartType);
  if (showLog) console.log(record);

  return score;
}

function applyDesignRules(chartType: ChartID, dataProps: BasicDataPropertyForAdvice[], chartTypeSpec: SingleViewSpec) {
  const toCheckRules = DesignRules.filter((rule) => rule.domain.indexOf(chartType) !== -1);
  const encodingSpec = toCheckRules.reduce((lastSpec, rule) => {
    const relatedSpec = rule.optimizer(dataProps, chartTypeSpec);
    return deepMix(lastSpec, relatedSpec);
  }, {});

  return encodingSpec;
}

/**
 * @public
 */
export function dataPropsToAdvices(
  dataProps: BasicDataPropertyForAdvice[],
  options?: AdvisorOptions,
  dataset?: Dataset
) {
  const enableRefine = options?.refine === undefined ? true : options.refine;

  const showLog = options?.showLog;

  const ChartWIKI = options?.chartKnowledge ? options.chartKnowledge : CKBJson('en-US', true);

  const CHART_ID_OPTIONS = Object.keys(ChartWIKI) as ChartID[];

  // score every
  const list: Advice[] = CHART_ID_OPTIONS.map((t: ChartID) => {
    // step 1: analyze score by rule
    const score = scoreRules(t, dataProps, options);
    if (score <= 0) return { type: t, spec: null, score };

    // step 2: field mapping to spec encoding
    const chartTypeSpec = getChartTypeSpec(t, dataProps, dataset);

    // FIXME kpi_panel and table spec 暂时可以为 null, 之后随需求增加 cfg
    if (!customChartType.includes(t) && !chartTypeSpec) return { type: t, spec: null, score: 0 };

    // step 3: apply design rules
    if (chartTypeSpec && enableRefine) {
      const encodingSpecs = applyDesignRules(t, dataProps, chartTypeSpec as SingleViewSpec);
      deepMix((chartTypeSpec as SingleViewSpec).encoding, encodingSpecs);
      // return { type: t, spec: chartTypeSpec, score }
    }

    return { type: t, spec: chartTypeSpec, score };
  });

  function compareAdvices(chart1: Advice, chart2: Advice) {
    if (chart1.score < chart2.score) {
      return 1;
    } else if (chart1.score > chart2.score) {
      return -1;
    } else {
      return 0;
    }
  }

  // filter and sorter
  const resultList = list.filter((e) => e.score > 0).sort(compareAdvices);

  if (showLog) console.log('🍒🍒🍒🍒🍒🍒 resultList 🍒🍒🍒🍒🍒🍒');
  if (showLog) console.log(resultList);

  return resultList;
}
